const { getDb, getAdmin } = require('../utils/firebaseAdmin');
const { ORDER_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');
const { runWithRetry } = require('./transactionRetry');
const { sendAlways } = require('./fcmAlertService');

const db = getDb();
const admin = getAdmin();

const UTR_REGEX = /^\d{12}$/;

function validateUtr(utrNumber) {
  if (!UTR_REGEX.test(String(utrNumber || ''))) {
    throw buildError('INVALID_INPUT', { message: 'utrNumber must be exactly 12 numeric digits.' });
  }
}

async function submitUtr(orderId, buyerId, utrNumber, paymentProofUrl = null) {
  validateUtr(utrNumber);

  await runWithRetry(() => db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw buildError('ORDER_NOT_FOUND');

    const order = orderSnap.data() || {};
    if (order.buyerId !== buyerId) throw buildError('FORBIDDEN');

    if (![ORDER_STATUS.PENDING, ORDER_STATUS.UTR_SUBMITTED].includes(order.paymentStatus)) {
      throw buildError('ORDER_STATUS_INVALID_FOR_UTR');
    }

    const now = admin.firestore.Timestamp.now();
    const expiresAtMs = order.expiresAt?.toMillis ? order.expiresAt.toMillis() : 0;
    if (expiresAtMs && expiresAtMs < now.toMillis()) {
      throw buildError('ORDER_EXPIRED_LATE_PAYMENT');
    }

    const utrRef = db.collection('utrIndex').doc(String(utrNumber));
    const utrSnap = await tx.get(utrRef);
    if (utrSnap.exists) throw buildError('DUPLICATE_UTR');

    tx.set(utrRef, {
      orderId,
      createdAt: now,
    });

    tx.update(orderRef, {
      utrNumber: String(utrNumber),
      paymentProofUrl: paymentProofUrl || null,
      paymentStatus: ORDER_STATUS.UTR_SUBMITTED,
      utrSubmittedAt: now,
      updatedAt: now,
    });
  }));

  try {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    const order = orderDoc.data() || {};
    await sendAlways({
      storeHandle: order.storeHandle || '',
      alertType: 'UTR_SUBMITTED',
      title: 'UTR submitted',
      body: `Order ${orderId} has submitted UTR and needs verification.`,
      data: { orderId },
    });
  } catch (e) {
    // non-blocking
  }

  return { orderId, utrNumber: String(utrNumber), paymentStatus: ORDER_STATUS.UTR_SUBMITTED };
}

async function correctUtrOnce(orderId, buyerId, newUtrNumber) {
  validateUtr(newUtrNumber);

  await runWithRetry(() => db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw buildError('ORDER_NOT_FOUND');

    const order = orderSnap.data() || {};
    if (order.buyerId !== buyerId) throw buildError('FORBIDDEN');

    if (![ORDER_STATUS.UTR_SUBMITTED, ORDER_STATUS.PAYMENT_UNDER_REVIEW].includes(order.paymentStatus)) {
      throw buildError('ORDER_STATUS_INVALID_FOR_UTR', { message: 'UTR correction is not allowed in current order state.' });
    }

    if (Boolean(order.utrCorrected)) {
      throw buildError('UTR_CORRECTION_ALREADY_USED');
    }

    const oldUtr = String(order.utrNumber || '').trim();
    if (!oldUtr) {
      throw buildError('INVALID_INPUT', { message: 'No existing UTR to correct.' });
    }

    if (oldUtr === String(newUtrNumber)) {
      throw buildError('INVALID_INPUT', { message: 'New UTR must be different from old UTR.' });
    }

    const newUtrRef = db.collection('utrIndex').doc(String(newUtrNumber));
    const newUtrSnap = await tx.get(newUtrRef);
    if (newUtrSnap.exists) throw buildError('DUPLICATE_UTR');

    const oldUtrRef = db.collection('utrIndex').doc(oldUtr);
    tx.delete(oldUtrRef);

    const now = admin.firestore.Timestamp.now();
    tx.set(newUtrRef, {
      orderId,
      createdAt: now,
    });

    tx.update(orderRef, {
      utrNumber: String(newUtrNumber),
      utrCorrected: true,
      utrCorrectedAt: now,
      updatedAt: now,
    });
  }));

  return {
    orderId,
    utrNumber: String(newUtrNumber),
    utrCorrected: true,
  };
}

module.exports = {
  submitUtr,
  correctUtrOnce,
};
