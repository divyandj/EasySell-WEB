const { getDb } = require('../utils/firebaseAdmin');
const { ORDER_STATUS, BUCKET_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');
const { computeAvailable } = require('./bucketAllocatorService');

const db = getDb();

/**
 * Checks whether the bucket assigned to a PENDING payment order is still healthy
 * (active, not over capacity). This lets the frontend decide whether to re-allocate
 * before the buyer attempts to pay.
 *
 * @param {string} orderId  – payment order document id (in `orders` collection)
 * @param {string} buyerId  – uid of the authenticated buyer
 * @returns {{ healthy: boolean, reason: string|null, bucketId: string|null }}
 */
async function checkBucketHealth(orderId, buyerId) {
  if (!orderId || !buyerId) throw buildError('INVALID_INPUT');

  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw buildError('ORDER_NOT_FOUND');

  const order = orderSnap.data() || {};
  if (order.buyerId !== buyerId) throw buildError('FORBIDDEN');

  // Only meaningful for orders still waiting for payment.
  if (order.paymentStatus !== ORDER_STATUS.PENDING) {
    return { healthy: true, reason: null, bucketId: order.bucketId || null };
  }

  const bucketId = order.bucketId;
  if (!bucketId) {
    return { healthy: false, reason: 'NO_BUCKET_ASSIGNED', bucketId: null };
  }

  const bucketSnap = await db.collection('buckets').doc(bucketId).get();
  if (!bucketSnap.exists) {
    return { healthy: false, reason: 'BUCKET_DELETED', bucketId };
  }

  const bucket = bucketSnap.data() || {};

  // Bucket must still be ACTIVE.
  if (bucket.status !== BUCKET_STATUS.ACTIVE) {
    return { healthy: false, reason: 'BUCKET_NOT_ACTIVE', bucketId };
  }

  // Bucket must still have capacity for at least this order's amount.
  const available = computeAvailable(bucket);
  if (available < 0) {
    return { healthy: false, reason: 'BUCKET_OVER_CAPACITY', bucketId };
  }

  return { healthy: true, reason: null, bucketId };
}

module.exports = {
  checkBucketHealth,
};
