const { getDb, getAdmin } = require('../utils/firebaseAdmin');
const { ORDER_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');
const { selectBucketForOrderTx, reserveBucketAmountTx } = require('./bucketAllocatorService');
const { allocateSuffixTx, reserveSuffixTx } = require('./suffixEngineService');
const { runWithRetry } = require('./transactionRetry');
const { sendAlert } = require('./fcmAlertService');

const db = getDb();
const admin = getAdmin();

function buildUpiDeepLink(vendorUpiId, amount, orderId) {
  return `upi://pay?pa=${encodeURIComponent(vendorUpiId)}&am=${Number(amount).toFixed(2)}&tn=${encodeURIComponent(`Order-${orderId}`)}&cu=INR`;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isSuffixCollision(error) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('already exists') || msg.includes('suffix');
}

function isReadinessRetryable(code) {
  return [
    'NO_BUCKET_AVAILABLE',
    'ORDER_TOO_LARGE_FOR_BUCKETS',
    'SUFFIX_POOL_EXHAUSTED',
    'TRANSACTION_RETRY_EXHAUSTED',
    'ORDER_CREATE_ATOMICITY_FAILED',
  ].includes(String(code || '').trim().toUpperCase());
}

async function getPaymentReadiness({ orderAmount, storeHandle }) {
  const amount = Number(orderAmount || 0);
  const normalizedStoreHandle = String(storeHandle || '').trim().toLowerCase();

  if (!normalizedStoreHandle) {
    return {
      ready: false,
      retryable: false,
      code: 'STORE_SCOPE_REQUIRED',
      message: 'Store context is required for payment readiness.',
      storeHandle: '',
      orderAmount: amount,
    };
  }

  if (amount <= 0) {
    return {
      ready: false,
      retryable: false,
      code: 'INVALID_INPUT',
      message: 'Positive orderAmount is required for payment readiness.',
      storeHandle: normalizedStoreHandle,
      orderAmount: amount,
    };
  }

  try {
    const probe = await runWithRetry(() => db.runTransaction(async (tx) => {
      const bucket = await selectBucketForOrderTx(tx, amount, normalizedStoreHandle);
      const suffix = await allocateSuffixTx(tx, bucket.bucketId);

      return {
        bucketId: bucket.bucketId,
        availableAmount: Number(bucket.availableAmount || 0),
        estimatedSuffix: suffix,
      };
    }));

    return {
      ready: true,
      retryable: false,
      code: null,
      message: 'Payment route is ready.',
      storeHandle: normalizedStoreHandle,
      orderAmount: amount,
      ...probe,
    };
  } catch (error) {
    const code = String(error?.code || 'ORDER_CREATE_ATOMICITY_FAILED');
    const message = String(error?.message || 'Payment route is currently unavailable.');

    return {
      ready: false,
      retryable: isReadinessRetryable(code),
      code,
      message,
      storeHandle: normalizedStoreHandle,
      orderAmount: amount,
    };
  }
}

async function createOrder({ buyerId, orderAmount, storeHandle }) {
  const normalizedBuyerId = String(buyerId || '').trim();
  const normalizedStoreHandle = String(storeHandle || '').trim().toLowerCase();
  const amount = Number(orderAmount || 0);

  if (!normalizedBuyerId || amount <= 0) {
    throw buildError('INVALID_INPUT', { message: 'buyerId and positive orderAmount are required.' });
  }

  try {
    const maxSuffixCollisionRetries = 3;
    let result = null;

    for (let attempt = 1; attempt <= maxSuffixCollisionRetries; attempt += 1) {
      try {
        // runWithRetry handles Firestore contention aborts; this outer loop handles suffix key collisions.
        // eslint-disable-next-line no-await-in-loop
        result = await runWithRetry(() => db.runTransaction(async (tx) => {
          const bucket = await selectBucketForOrderTx(tx, amount, normalizedStoreHandle || null);
          const suffix = await allocateSuffixTx(tx, bucket.bucketId);
          const uniquePayableAmount = Number((amount + (suffix / 100)).toFixed(2));

          const orderRef = db.collection('orders').doc();
          const now = admin.firestore.Timestamp.now();
          const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + (15 * 60 * 1000));

          const orderDoc = {
            buyerId: normalizedBuyerId,
            bucketId: bucket.bucketId,
            storeHandle: normalizedStoreHandle || bucket.storeHandle || '',
            vendorUpiSnapshot: bucket.vendorUpiId || '',
            qrImageSnapshot: bucket.qrImageUrl || '',
            orderAmount: amount,
            uniquePayableAmount,
            paiseSuffix: suffix,
            utrNumber: null,
            paymentProofUrl: null,
            paymentStatus: ORDER_STATUS.PENDING,
            expiresAt,
            createdAt: now,
            updatedAt: now,
            cancelledAt: null,
            utrCorrected: false,
          };

          reserveBucketAmountTx(tx, bucket, amount);
          tx.set(orderRef, orderDoc);
          reserveSuffixTx(tx, bucket.bucketId, suffix, orderRef.id);

          return {
            orderId: orderRef.id,
            uniquePayableAmount,
            qrImageUrl: orderDoc.qrImageSnapshot,
            upiDeepLink: buildUpiDeepLink(orderDoc.vendorUpiSnapshot, uniquePayableAmount, orderRef.id),
            expiresAt: expiresAt.toMillis(),
          };
        }));

        break;
      } catch (txError) {
        if (!isSuffixCollision(txError) || attempt >= maxSuffixCollisionRetries) {
          throw txError;
        }
        // eslint-disable-next-line no-await-in-loop
        await wait(30 * attempt);
      }
    }

    if (!result) {
      throw buildError('SUFFIX_COLLISION_RETRY_FAILED');
    }

    return result;
  } catch (error) {
    if (error.code === 'NO_BUCKET_AVAILABLE' || error.code === 'ORDER_TOO_LARGE_FOR_BUCKETS') {
      try {
        await sendAlert({
          storeHandle: normalizedStoreHandle,
          alertType: 'NO_BUCKET_AVAILABLE',
          title: 'No bucket available',
          body: 'Unable to allocate bucket for incoming order.',
        });
      } catch (e) {
        // Non-blocking.
      }
    }

    if (error.code === 'SUFFIX_POOL_EXHAUSTED') {
      try {
        await sendAlert({
          storeHandle: normalizedStoreHandle,
          alertType: 'SUFFIX_POOL_EXHAUSTED',
          title: 'Suffix pool exhausted',
          body: 'All suffix slots are occupied for an active bucket.',
        });
      } catch (e) {
        // Non-blocking.
      }
    }

    if (isSuffixCollision(error)) {
      throw buildError('SUFFIX_COLLISION_RETRY_FAILED', { details: String(error.message || error) });
    }

    if (error.code && error.httpStatus) throw error;
    throw buildError('ORDER_CREATE_ATOMICITY_FAILED', { details: String(error.message || error) });
  }
}

async function getOrderStatus(orderId, buyerId) {
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw buildError('ORDER_NOT_FOUND');

  const order = snap.data() || {};
  if (buyerId && order.buyerId !== buyerId) {
    throw buildError('FORBIDDEN');
  }

  return {
    paymentStatus: order.paymentStatus,
    expiresAt: order.expiresAt?.toMillis ? order.expiresAt.toMillis() : null,
    cancelledAt: order.cancelledAt?.toMillis ? order.cancelledAt.toMillis() : null,
  };
}

module.exports = {
  createOrder,
  getOrderStatus,
  getPaymentReadiness,
};
