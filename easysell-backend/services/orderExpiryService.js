const { getDb, getAdmin } = require('../utils/firebaseAdmin');
const { ORDER_STATUS } = require('../constants/paymentStatuses');
const { suffixToDocId } = require('./suffixEngineService');
const { runWithRetry } = require('./transactionRetry');

const db = getDb();
const admin = getAdmin();

async function expireOrder(orderId) {
  await runWithRetry(() => db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) return;

    const order = orderSnap.data() || {};
    if (order.paymentStatus !== ORDER_STATUS.PENDING) return;

    const bucketId = order.bucketId;
    const orderAmount = Number(order.orderAmount || 0);
    const suffix = Number(order.paiseSuffix || 0);

    if (bucketId) {
      const bucketRef = db.collection('buckets').doc(bucketId);
      const bucketSnap = await tx.get(bucketRef);
      if (bucketSnap.exists) {
        const bucket = bucketSnap.data() || {};
        const nextReserved = Math.max(0, Number(bucket.reservedAmount || 0) - orderAmount);
        tx.update(bucketRef, {
          reservedAmount: nextReserved,
          updatedAt: admin.firestore.Timestamp.now(),
        });
      }
    }

    if (bucketId && suffix >= 1) {
      const suffixRef = db.collection('suffixIndex').doc(suffixToDocId(bucketId, suffix));
      tx.delete(suffixRef);
    }

    tx.update(orderRef, {
      paymentStatus: ORDER_STATUS.EXPIRED,
      expiredAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }));
}

async function runExpirySweep() {
  const nowMs = Date.now();
  const batchSize = 250;
  const maxScan = 2000;
  let scanned = 0;
  let lastDoc = null;

  while (scanned < maxScan) {
    let query = db.collection('orders')
      .where('paymentStatus', '==', ORDER_STATUS.PENDING)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(batchSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    scanned += snap.size;
    lastDoc = snap.docs[snap.docs.length - 1];

    for (const doc of snap.docs) {
      const order = doc.data() || {};
      const expiresAt = order.expiresAt;
      const expiryMs = expiresAt && typeof expiresAt.toMillis === 'function'
        ? expiresAt.toMillis()
        : Number(expiresAt || 0);

      if (!Number.isFinite(expiryMs) || expiryMs > nowMs) {
        continue;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        await expireOrder(doc.id);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Expiry sweep failed for order', doc.id, error.message || error);
      }
    }

    if (snap.size < batchSize) break;
  }
}

function startOrderExpiryJob() {
  const intervalMs = 5 * 60 * 1000;
  setInterval(() => {
    runExpirySweep().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Order expiry sweep failed:', error.message || error);
    });
  }, intervalMs);
}

module.exports = {
  startOrderExpiryJob,
  runExpirySweep,
};
