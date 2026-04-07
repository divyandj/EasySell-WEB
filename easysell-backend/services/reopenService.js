const { getDb, getAdmin } = require('../utils/firebaseAdmin');
const { ORDER_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');
const { runWithRetry } = require('./transactionRetry');

const db = getDb();
const admin = getAdmin();

async function reopenDisputedOrder(orderId, adminUid) {
  await runWithRetry(() => db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw buildError('ORDER_NOT_FOUND');

    const order = orderSnap.data() || {};
    if (order.paymentStatus !== ORDER_STATUS.DISPUTED) {
      throw buildError('INVALID_INPUT', { message: 'Only disputed orders can be reopened.' });
    }

    const now = admin.firestore.Timestamp.now();
    tx.update(orderRef, {
      paymentStatus: ORDER_STATUS.PAYMENT_UNDER_REVIEW,
      reopenedAt: now,
      reopenedBy: adminUid || '',
      updatedAt: now,
    });
  }));

  return { orderId, paymentStatus: ORDER_STATUS.PAYMENT_UNDER_REVIEW };
}

module.exports = {
  reopenDisputedOrder,
};
