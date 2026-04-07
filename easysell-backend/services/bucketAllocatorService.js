const { getDb } = require('../utils/firebaseAdmin');
const { BUCKET_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');
const { assertLedgerCanCreateBucket } = require('./debtLedgerService');

const db = getDb();

function computeAvailable(bucket) {
  const limitAmount = Number(bucket.limitAmount || 0);
  const reservedAmount = Number(bucket.reservedAmount || 0);
  const collectedAmount = Number(bucket.collectedAmount || 0);
  return limitAmount - reservedAmount - collectedAmount;
}

async function listBucketsWithComputedAvailable() {
  const snap = await db.collection('buckets').orderBy('priority', 'asc').get();
  return snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      bucketId: d.id,
      ...data,
      availableAmount: computeAvailable(data),
    };
  });
}

async function createBucketWithLedgerGuard(payload) {
  const vendorName = String(payload.vendorName || '').trim();
  const vendorUpiId = String(payload.vendorUpiId || '').trim();
  const qrImageUrl = String(payload.qrImageUrl || '').trim();
  const qrType = String(payload.qrType || '').trim().toUpperCase();
  const priority = Number(payload.priority);
  const limitAmount = Number(payload.limitAmount);
  const debtLedgerId = String(payload.debtLedgerId || '').trim();

  if (!vendorName || !vendorUpiId || !qrImageUrl || !debtLedgerId || !Number.isFinite(priority) || limitAmount <= 0) {
    throw buildError('INVALID_INPUT', { message: 'vendorName, vendorUpiId, qrImageUrl, priority, limitAmount, debtLedgerId are required.' });
  }

  if (!['UPI', 'BANK'].includes(qrType)) {
    throw buildError('INVALID_INPUT', { message: 'qrType must be UPI or BANK.' });
  }

  await assertLedgerCanCreateBucket(debtLedgerId);

  const now = new Date();
  const ref = db.collection('buckets').doc();
  const doc = {
    vendorName,
    vendorUpiId,
    qrImageUrl,
    qrType,
    priority,
    limitAmount,
    reservedAmount: 0,
    collectedAmount: 0,
    status: BUCKET_STATUS.PAUSED,
    debtLedgerId,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(doc);
  return { bucketId: ref.id, ...doc };
}

async function updateBucketStatus(bucketId, status) {
  const nextStatus = String(status || '').toUpperCase();
  if (!Object.values(BUCKET_STATUS).includes(nextStatus) || nextStatus === BUCKET_STATUS.FULL) {
    throw buildError('INVALID_INPUT', { message: 'Invalid bucket status transition.' });
  }

  const bucketRef = db.collection('buckets').doc(bucketId);

  await db.runTransaction(async (tx) => {
    const bucketSnap = await tx.get(bucketRef);
    if (!bucketSnap.exists) throw buildError('BUCKET_NOT_FOUND');

    const bucket = bucketSnap.data() || {};
    if (nextStatus === BUCKET_STATUS.ACTIVE) {
      const activeSnap = await tx.get(
        db.collection('buckets')
          .where('vendorUpiId', '==', bucket.vendorUpiId)
          .where('status', '==', BUCKET_STATUS.ACTIVE)
      );

      const hasOtherActive = activeSnap.docs.some((doc) => doc.id !== bucketId);
      if (hasOtherActive) {
        throw buildError('VENDOR_ACTIVE_BUCKET_EXISTS');
      }
    }

    tx.update(bucketRef, {
      status: nextStatus,
      updatedAt: new Date(),
    });
  });

  const finalSnap = await bucketRef.get();
  return { bucketId, ...(finalSnap.data() || {}) };
}

async function selectBucketForOrderTx(tx, orderAmount, storeHandle) {
  let q = db.collection('buckets').where('status', '==', BUCKET_STATUS.ACTIVE);
  if (storeHandle) q = q.where('storeHandle', '==', storeHandle);

  const snap = await tx.get(q);
  if (snap.empty) {
    throw buildError('NO_BUCKET_AVAILABLE');
  }

  const candidates = snap.docs
    .map((d) => ({ bucketId: d.id, ref: d.ref, ...d.data() }))
    .map((b) => ({ ...b, availableAmount: computeAvailable(b) }))
    .sort((a, b) => {
      const p = Number(a.priority || 9999) - Number(b.priority || 9999);
      if (p !== 0) return p;
      return Number(b.availableAmount || 0) - Number(a.availableAmount || 0);
    });

  const pick = candidates.find((b) => Number(b.availableAmount || 0) >= Number(orderAmount || 0));
  if (!pick) {
    throw buildError('ORDER_TOO_LARGE_FOR_BUCKETS');
  }

  return pick;
}

function reserveBucketAmountTx(tx, bucket, orderAmount) {
  const currentReserved = Number(bucket.reservedAmount || 0);
  const currentCollected = Number(bucket.collectedAmount || 0);
  const limitAmount = Number(bucket.limitAmount || 0);

  if (currentReserved < 0 || currentCollected < 0 || limitAmount < 0) {
    throw buildError('BUCKET_INVARIANT_VIOLATION');
  }

  const reservedAmount = Number(bucket.reservedAmount || 0) + Number(orderAmount || 0);
  const collectedAmount = currentCollected;
  if ((reservedAmount + collectedAmount) > limitAmount) {
    throw buildError('BUCKET_CAPACITY_CHANGED');
  }

  tx.update(bucket.ref, {
    reservedAmount,
    updatedAt: new Date(),
  });
}

module.exports = {
  computeAvailable,
  listBucketsWithComputedAvailable,
  createBucketWithLedgerGuard,
  updateBucketStatus,
  selectBucketForOrderTx,
  reserveBucketAmountTx,
};
