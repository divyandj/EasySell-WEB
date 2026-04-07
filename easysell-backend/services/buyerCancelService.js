const { getDb, getAdmin } = require('../utils/firebaseAdmin');
const { ORDER_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');
const { suffixToDocId } = require('./suffixEngineService');
const { runWithRetry } = require('./transactionRetry');

const db = getDb();
const admin = getAdmin();

async function cancelPendingOrder(orderId, buyerId) {
  if (!orderId || !buyerId) throw buildError('INVALID_INPUT');

  await runWithRetry(() => db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw buildError('ORDER_NOT_FOUND');

    const order = orderSnap.data() || {};
    if (order.buyerId !== buyerId) throw buildError('FORBIDDEN');
    if (order.paymentStatus !== ORDER_STATUS.PENDING) {
      throw buildError('ORDER_STATUS_INVALID_FOR_UTR', { message: 'Only pending orders can be cancelled by buyer.' });
    }

    const now = admin.firestore.Timestamp.now();
    const expiresAtMs = order.expiresAt?.toMillis ? order.expiresAt.toMillis() : 0;
    if (expiresAtMs && expiresAtMs < now.toMillis()) {
      throw buildError('ORDER_EXPIRED');
    }

    const bucketRef = db.collection('buckets').doc(order.bucketId);
    const bucketSnap = await tx.get(bucketRef);
    if (bucketSnap.exists) {
      const bucket = bucketSnap.data() || {};
      const nextReserved = Math.max(0, Number(bucket.reservedAmount || 0) - Number(order.orderAmount || 0));
      tx.update(bucketRef, {
        reservedAmount: nextReserved,
        updatedAt: now,
      });
    }

    if (order.bucketId && Number(order.paiseSuffix || 0) >= 1) {
      const suffixRef = db.collection('suffixIndex').doc(suffixToDocId(order.bucketId, Number(order.paiseSuffix)));
      tx.delete(suffixRef);
    }

    tx.update(orderRef, {
      paymentStatus: ORDER_STATUS.CANCELLED_BY_BUYER,
      cancelledAt: now,
      updatedAt: now,
    });
  }));

  return { orderId, cancelled: true };
}

module.exports = {
  cancelPendingOrder,
};
