const { getDb, getAdmin } = require('../utils/firebaseAdmin');
const { ORDER_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');
const { runWithRetry } = require('./transactionRetry');
const {
  computeAvailable,
  reserveBucketAmountTx,
  selectBucketForOrderTxPreferEmpty,
} = require('./bucketAllocatorService');
const {
  allocateSuffixTx,
  reserveSuffixTx,
  suffixToDocId,
} = require('./suffixEngineService');

const db = getDb();
const admin = getAdmin();

async function reopenDisputedOrder(orderId, adminUid, storeHandle) {
  const scopedStoreHandle = String(storeHandle || '').trim().toLowerCase();
  if (!scopedStoreHandle) throw buildError('STORE_SCOPE_REQUIRED');

  let result = null;

  await runWithRetry(() => db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw buildError('ORDER_NOT_FOUND');

    const order = orderSnap.data() || {};
    if (String(order.storeHandle || '').trim().toLowerCase() !== scopedStoreHandle) {
      throw buildError('STORE_SCOPE_MISMATCH');
    }
    if (order.paymentStatus !== ORDER_STATUS.DISPUTED) {
      throw buildError('INVALID_INPUT', { message: 'Only disputed orders can be reopened.' });
    }

    const orderAmount = Number(order.orderAmount || 0);
    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
      throw buildError('INVALID_INPUT', { message: 'orderAmount is required for reopen.' });
    }

    const now = admin.firestore.Timestamp.now();
    let targetBucket = null;

    if (order.bucketId) {
      const bucketRef = db.collection('buckets').doc(order.bucketId);
      const bucketSnap = await tx.get(bucketRef);
      if (bucketSnap.exists) {
        const bucket = bucketSnap.data() || {};
        if (String(bucket.storeHandle || '').trim().toLowerCase() === scopedStoreHandle) {
          const available = computeAvailable(bucket);
          if (available >= orderAmount) {
            targetBucket = { bucketId: bucketRef.id, ref: bucketRef, ...bucket };
          }
        }
      }
    }

    if (!targetBucket) {
      // Prefer an empty collection account when reassigning.
      targetBucket = await selectBucketForOrderTxPreferEmpty(tx, orderAmount, scopedStoreHandle);
    }

    let resolvedSuffix = Number(order.paiseSuffix || 0);
    let shouldReserveSuffix = false;

    if (targetBucket.bucketId === order.bucketId && Number.isFinite(resolvedSuffix) && resolvedSuffix >= 1) {
      const suffixRef = db.collection('suffixIndex').doc(suffixToDocId(targetBucket.bucketId, resolvedSuffix));
      const suffixSnap = await tx.get(suffixRef);
      if (!suffixSnap.exists) {
        shouldReserveSuffix = true;
      } else if (suffixSnap.get('orderId') !== orderId) {
        resolvedSuffix = 0;
      }
    } else {
      resolvedSuffix = 0;
    }

    if (!Number.isFinite(resolvedSuffix) || resolvedSuffix < 1) {
      resolvedSuffix = await allocateSuffixTx(tx, targetBucket.bucketId);
      shouldReserveSuffix = true;
    }

    let uniquePayableAmount = Number(order.uniquePayableAmount || 0);
    if (Number.isFinite(resolvedSuffix) && resolvedSuffix >= 1) {
      uniquePayableAmount = Number((orderAmount + (resolvedSuffix / 100)).toFixed(2));
    }

    const updates = {
      paymentStatus: ORDER_STATUS.PAYMENT_UNDER_REVIEW,
      reopenedAt: now,
      reopenedBy: adminUid || '',
      updatedAt: now,
      bucketId: targetBucket.bucketId,
      paiseSuffix: resolvedSuffix,
      uniquePayableAmount,
      vendorUpiSnapshot: targetBucket.vendorUpiId || order.vendorUpiSnapshot || '',
      qrImageSnapshot: targetBucket.qrImageUrl || order.qrImageSnapshot || '',
    };

    const targetStoreHandle = String(targetBucket.storeHandle || scopedStoreHandle || '').trim().toLowerCase();
    const currentStoreHandle = String(order.storeHandle || '').trim().toLowerCase();
    if (targetStoreHandle && targetStoreHandle !== currentStoreHandle) {
      updates.storeHandle = targetStoreHandle;
    }

    reserveBucketAmountTx(tx, targetBucket, orderAmount);
    if (shouldReserveSuffix) {
      reserveSuffixTx(tx, targetBucket.bucketId, resolvedSuffix, orderId);
    }
    tx.update(orderRef, updates);
    result = { orderId, paymentStatus: updates.paymentStatus };
  }));

  return result || { orderId, paymentStatus: ORDER_STATUS.PAYMENT_UNDER_REVIEW };
}

module.exports = {
  reopenDisputedOrder,
};
