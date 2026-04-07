const { getDb, getAdmin } = require('../utils/firebaseAdmin');
const { ORDER_STATUS, CONFIRM_ACTION, BUCKET_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');
const { runWithRetry } = require('./transactionRetry');
const { suffixToDocId } = require('./suffixEngineService');
const { applyReconcileToLedgerTx } = require('./debtLedgerService');
const { sendAlways } = require('./fcmAlertService');

const db = getDb();
const admin = getAdmin();

function parseLimit(limitParam) {
  const n = Number(limitParam || 20);
  if (!Number.isFinite(n) || n <= 0) return 20;
  return Math.min(n, 100);
}

function parseCursor(cursorParam) {
  if (!cursorParam) return null;
  const millis = Number(cursorParam);
  if (!Number.isFinite(millis) || millis <= 0) return null;
  return admin.firestore.Timestamp.fromMillis(millis);
}

function toMillis(ts) {
  return ts?.toMillis ? ts.toMillis() : null;
}

async function listByStatusesScan(statuses, reqQuery, includeStatus = false, fallbackStatus = null) {
  const limit = parseLimit(reqQuery.limit);
  let scanCursor = parseCursor(reqQuery.cursor);

  const wanted = new Set(statuses);
  const matched = [];
  const batchSize = Math.max(50, limit * 3);
  let loops = 0;
  let exhausted = false;

  while (matched.length < (limit + 1) && loops < 10) {
    loops += 1;

    let q = db.collection('orders').orderBy('createdAt', 'desc').limit(batchSize);
    if (scanCursor) q = q.startAfter(scanCursor);

    // eslint-disable-next-line no-await-in-loop
    const snap = await q.get();
    if (snap.empty) {
      exhausted = true;
      break;
    }

    for (const d of snap.docs) {
      const o = d.data() || {};
      if (!wanted.has(o.paymentStatus)) continue;
      matched.push({ id: d.id, ...o });
      if (matched.length >= (limit + 1)) break;
    }

    const lastDoc = snap.docs[snap.docs.length - 1];
    scanCursor = lastDoc?.data()?.createdAt || null;

    if (snap.docs.length < batchSize) {
      exhausted = true;
      break;
    }
  }

  const pageItems = matched.slice(0, limit);
  const hasMore = matched.length > limit && !exhausted;

  const items = pageItems.map((o) => ({
    orderId: o.id,
    orderAmount: Number(o.orderAmount || 0),
    uniquePayableAmount: Number(o.uniquePayableAmount || 0),
    utrNumber: o.utrNumber || null,
    paymentStatus: includeStatus ? o.paymentStatus : fallbackStatus,
    createdAt: toMillis(o.createdAt),
    cancelledAt: toMillis(o.cancelledAt),
  }));

  const nextCursor = hasMore && pageItems.length
    ? toMillis(pageItems[pageItems.length - 1].createdAt)
    : null;

  return { items, nextCursor };
}

async function listByStatus(status, reqQuery, includeStatus = false) {
  return listByStatusesScan([status], reqQuery, includeStatus, status);
}

async function listPendingUtrOrders(query) {
  return listByStatus(ORDER_STATUS.UTR_SUBMITTED, query);
}

async function listReviewOrders(query) {
  return listByStatus(ORDER_STATUS.PAYMENT_UNDER_REVIEW, query);
}

async function listHistoryOrders(query) {
  const historyStatuses = [
    ORDER_STATUS.RECONCILED,
    ORDER_STATUS.DISPUTED,
    ORDER_STATUS.CANCELLED_BY_BUYER,
    ORDER_STATUS.EXPIRED,
  ];
  return listByStatusesScan(historyStatuses, query, true);
}

async function confirmOrder(orderId, action, adminUid) {
  const normalized = String(action || '').toUpperCase();
  if (![CONFIRM_ACTION.RECONCILE, CONFIRM_ACTION.DISPUTE].includes(normalized)) {
    throw buildError('INVALID_INPUT', { message: 'action must be RECONCILE or DISPUTE.' });
  }

  const result = await runWithRetry(() => db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw buildError('ORDER_NOT_FOUND');

    const order = orderSnap.data() || {};
    if (order.paymentStatus === ORDER_STATUS.EXPIRED) {
      throw buildError('ORDER_EXPIRED');
    }

    if (![ORDER_STATUS.UTR_SUBMITTED, ORDER_STATUS.PAYMENT_UNDER_REVIEW].includes(order.paymentStatus)) {
      if (order.paymentStatus === ORDER_STATUS.DISPUTED) {
        throw buildError('REOPEN_REQUIRED');
      }
      throw buildError('ORDER_NOT_CONFIRMABLE');
    }

    const now = admin.firestore.Timestamp.now();
    const bucketRef = db.collection('buckets').doc(order.bucketId);
    const bucketSnap = await tx.get(bucketRef);
    if (!bucketSnap.exists) throw buildError('BUCKET_NOT_FOUND');

    const bucket = bucketSnap.data() || {};
    const orderAmount = Number(order.orderAmount || 0);
    const currentReserved = Number(bucket.reservedAmount || 0);
    const currentCollected = Number(bucket.collectedAmount || 0);

    const updates = {
      paymentStatus: normalized === CONFIRM_ACTION.RECONCILE ? ORDER_STATUS.RECONCILED : ORDER_STATUS.DISPUTED,
      updatedAt: now,
      confirmedBy: adminUid || '',
      confirmedAt: now,
    };

    const nextReserved = Math.max(0, currentReserved - orderAmount);

    let ledgerUpdate = null;

    if (normalized === CONFIRM_ACTION.RECONCILE) {
      const nextCollected = currentCollected + orderAmount;
      const nextBucketStatus = nextCollected >= Number(bucket.limitAmount || 0)
        ? BUCKET_STATUS.FULL
        : bucket.status;

      const ledgerRef = db.collection('debtLedger').doc(order.debtLedgerId || bucket.debtLedgerId || '');
      ledgerUpdate = await applyReconcileToLedgerTx(tx, ledgerRef, orderAmount);

      tx.update(bucketRef, {
        reservedAmount: nextReserved,
        collectedAmount: nextCollected,
        status: nextBucketStatus,
        updatedAt: now,
      });
    } else {
      tx.update(bucketRef, {
        reservedAmount: nextReserved,
        updatedAt: now,
      });
    }

    if (order.bucketId && Number(order.paiseSuffix || 0) >= 1) {
      tx.delete(db.collection('suffixIndex').doc(suffixToDocId(order.bucketId, Number(order.paiseSuffix))));
    }

    tx.update(orderRef, updates);

    return {
      orderId,
      paymentStatus: updates.paymentStatus,
      bucketStatus: normalized === CONFIRM_ACTION.RECONCILE
        ? (currentCollected + orderAmount >= Number(bucket.limitAmount || 0) ? BUCKET_STATUS.FULL : bucket.status)
        : bucket.status,
      ledgerOverpaid: Boolean(ledgerUpdate?.enteredOverpaid),
      ledgerId: ledgerUpdate?.ledgerId || null,
      storeHandle: order.storeHandle || '',
    };
  }));

  if (result.bucketStatus === BUCKET_STATUS.FULL) {
    try {
      await sendAlways({
        storeHandle: result.storeHandle,
        alertType: 'BUCKET_FULL',
        title: 'Bucket is full',
        body: 'A bucket has reached its limit. Activate the next bucket manually.',
        data: { orderId: result.orderId },
      });
    } catch (e) {
      // Non-blocking.
    }
  }

  if (result.ledgerOverpaid && result.ledgerId) {
    try {
      await sendAlways({
        storeHandle: result.storeHandle,
        alertType: 'LEDGER_OVERPAID',
        title: 'Ledger overpaid',
        body: `Ledger ${result.ledgerId} is overpaid.`,
        data: { ledgerId: result.ledgerId, orderId: result.orderId },
      });
    } catch (e) {
      // Non-blocking.
    }
  }

  return result;
}

module.exports = {
  listPendingUtrOrders,
  listReviewOrders,
  listHistoryOrders,
  confirmOrder,
};
