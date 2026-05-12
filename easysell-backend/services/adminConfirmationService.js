const { getDb, getAdmin } = require('../utils/firebaseAdmin');
const { ORDER_STATUS, CONFIRM_ACTION, BUCKET_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');
const { runWithRetry } = require('./transactionRetry');
const { suffixToDocId } = require('./suffixEngineService');
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

async function listByStatusesScan(statuses, reqQuery, storeHandle, includeStatus = false, fallbackStatus = null) {
  // Optimized indexed query version: use Firestore WHEREs to reduce full collection scans.
  const scopedStoreHandle = String(storeHandle || '').trim().toLowerCase();
  if (!scopedStoreHandle) throw buildError('STORE_SCOPE_REQUIRED');

  const limit = parseLimit(reqQuery.limit);
  const cursor = parseCursor(reqQuery.cursor);

  // Build base query scoped to storeHandle
  let q = db.collection('orders').where('storeHandle', '==', scopedStoreHandle);

  if (!Array.isArray(statuses) || statuses.length === 0) {
    throw buildError('INVALID_INPUT', { message: 'statuses required' });
  }

  if (statuses.length === 1) {
    q = q.where('paymentStatus', '==', statuses[0]);
  } else {
    // Firestore supports whereIn for up to 10 values — history statuses are small
    q = q.where('paymentStatus', 'in', statuses);
  }

  q = q.orderBy('createdAt', 'desc').limit(limit + 1);
  if (cursor) q = q.startAfter(cursor);

  const snap = await q.get();

  const docs = snap.empty ? [] : snap.docs;
  const pageDocs = docs.slice(0, limit);
  const hasMore = docs.length > limit;

  const items = pageDocs.map((d) => {
    const o = d.data() || {};
    return {
      orderId: d.id,
      orderAmount: Number(o.orderAmount || 0),
      uniquePayableAmount: Number(o.uniquePayableAmount || 0),
      utrNumber: o.utrNumber || null,
      paymentStatus: includeStatus ? o.paymentStatus : fallbackStatus,
      createdAt: toMillis(o.createdAt),
      cancelledAt: toMillis(o.cancelledAt),
    };
  });

  const lastDoc = pageDocs.length ? pageDocs[pageDocs.length - 1] : null;
  const lastCreatedAt = lastDoc ? lastDoc.get('createdAt') : null;
  const nextCursor = hasMore && lastCreatedAt ? toMillis(lastCreatedAt) : null;

  return { items, nextCursor };
}

async function listByStatus(status, reqQuery, storeHandle, includeStatus = false) {
  return listByStatusesScan([status], reqQuery, storeHandle, includeStatus, status);
}

async function listPendingUtrOrders(query, storeHandle) {
  return listByStatus(ORDER_STATUS.UTR_SUBMITTED, query, storeHandle);
}

async function listReviewOrders(query, storeHandle) {
  return listByStatus(ORDER_STATUS.PAYMENT_UNDER_REVIEW, query, storeHandle);
}

async function listHistoryOrders(query, storeHandle) {
  const historyStatuses = [
    ORDER_STATUS.RECONCILED,
    ORDER_STATUS.DISPUTED,
    ORDER_STATUS.CANCELLED_BY_BUYER,
    ORDER_STATUS.EXPIRED,
  ];
  return listByStatusesScan(historyStatuses, query, storeHandle, true);
}

async function confirmOrder(orderId, action, adminUid, storeHandle) {
  const normalized = String(action || '').toUpperCase();
  const scopedStoreHandle = String(storeHandle || '').trim().toLowerCase();
  if (![CONFIRM_ACTION.RECONCILE, CONFIRM_ACTION.DISPUTE].includes(normalized)) {
    throw buildError('INVALID_INPUT', { message: 'action must be RECONCILE or DISPUTE.' });
  }
  if (!scopedStoreHandle) {
    throw buildError('STORE_SCOPE_REQUIRED');
  }

  const result = await runWithRetry(() => db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw buildError('ORDER_NOT_FOUND');

    const order = orderSnap.data() || {};
    if (String(order.storeHandle || '').trim().toLowerCase() !== scopedStoreHandle) {
      throw buildError('STORE_SCOPE_MISMATCH');
    }
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
    if (String(bucket.storeHandle || '').trim().toLowerCase() !== scopedStoreHandle) {
      throw buildError('STORE_SCOPE_MISMATCH');
    }
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

    if (normalized === CONFIRM_ACTION.RECONCILE) {
      const nextCollected = currentCollected + orderAmount;
      const nextBucketStatus = nextCollected >= Number(bucket.limitAmount || 0)
        ? BUCKET_STATUS.FULL
        : bucket.status;

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
      storeHandle: order.storeHandle || '',
    };
  }));

  if (result.bucketStatus === BUCKET_STATUS.FULL) {
    try {
      await sendAlways({
        storeHandle: result.storeHandle,
        alertType: 'BUCKET_FULL',
        title: 'Collection account is full',
        body: 'A collection account has reached its limit. Activate the next account manually.',
        data: { orderId: result.orderId },
      });
    } catch (e) {
      // Non-blocking.
    }
  }

  // Propagate status to any nested catalogue orders that reference this payment order id.
  // This is a best-effort batch outside the transaction to keep catalogue-order views in sync.
  try {
    const now = admin.firestore.Timestamp.now();
    await propagateToNestedOrders(orderId, {
      paymentStatus: result.paymentStatus,
      confirmedAt: now,
      confirmedBy: adminUid || '',
      updatedAt: now,
    });
  } catch (e) {
    // log but don't fail the response
    console.warn('Failed to propagate to nested orders after confirmOrder:', e.message || e);
  }

  return result;
}

async function unresolveReconciledOrder(orderId, adminUid, storeHandle) {
  const scopedStoreHandle = String(storeHandle || '').trim().toLowerCase();
  if (!scopedStoreHandle) {
    throw buildError('STORE_SCOPE_REQUIRED');
  }

  return runWithRetry(() => db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw buildError('ORDER_NOT_FOUND');

    const order = orderSnap.data() || {};
    if (String(order.storeHandle || '').trim().toLowerCase() !== scopedStoreHandle) {
      throw buildError('STORE_SCOPE_MISMATCH');
    }
    if (order.paymentStatus !== ORDER_STATUS.RECONCILED) {
      throw buildError('ORDER_NOT_RECONCILED');
    }

    const bucketRef = db.collection('buckets').doc(order.bucketId);
    const bucketSnap = await tx.get(bucketRef);
    if (!bucketSnap.exists) throw buildError('BUCKET_NOT_FOUND');

    const bucket = bucketSnap.data() || {};
    if (String(bucket.storeHandle || '').trim().toLowerCase() !== scopedStoreHandle) {
      throw buildError('STORE_SCOPE_MISMATCH');
    }

    const orderAmount = Number(order.orderAmount || 0);
    const currentReserved = Number(bucket.reservedAmount || 0);
    const currentCollected = Number(bucket.collectedAmount || 0);
    if (currentCollected < orderAmount) {
      throw buildError('INSUFFICIENT_BUCKET_BALANCE');
    }

    const suffix = Number(order.paiseSuffix || 0);
    let suffixRef = null;
    if (order.bucketId && suffix >= 1) {
      suffixRef = db.collection('suffixIndex').doc(suffixToDocId(order.bucketId, suffix));
      const suffixSnap = await tx.get(suffixRef);
      if (suffixSnap.exists) {
        const existing = suffixSnap.data() || {};
        if (String(existing.orderId || '') !== String(orderId)) {
          throw buildError('SUFFIX_RESERVATION_CONFLICT');
        }
      }
    }

    const now = admin.firestore.Timestamp.now();
    const nextCollected = Number((currentCollected - orderAmount).toFixed(2));
    const nextReserved = Number((currentReserved + orderAmount).toFixed(2));
    const limitAmount = Number(bucket.limitAmount || 0);
    const nextBucketStatus = (bucket.status === BUCKET_STATUS.FULL && nextCollected < limitAmount)
      ? BUCKET_STATUS.ACTIVE
      : bucket.status;

    tx.update(bucketRef, {
      collectedAmount: nextCollected,
      reservedAmount: nextReserved,
      status: nextBucketStatus,
      updatedAt: now,
    });

    if (suffixRef) {
      tx.set(suffixRef, {
        bucketId: order.bucketId,
        suffix,
        orderId,
        createdAt: now,
      }, { merge: true });
    }

    tx.update(orderRef, {
      paymentStatus: ORDER_STATUS.PAYMENT_UNDER_REVIEW,
      unresolvedAt: now,
      unresolvedBy: adminUid || '',
      unresolveAction: 'RECONCILED_TO_REVIEW',
      confirmedAt: null,
      confirmedBy: null,
      updatedAt: now,
    });

    return {
      orderId,
      paymentStatus: ORDER_STATUS.PAYMENT_UNDER_REVIEW,
      bucketStatus: nextBucketStatus,
    };
  }));
}

// Ensure nested orders are updated when an order is moved back to review
async function unresolveAndPropagate(orderId, adminUid, storeHandle) {
  const result = await unresolveReconciledOrder(orderId, adminUid, storeHandle);
  try {
    const now = admin.firestore.Timestamp.now();
    await propagateToNestedOrders(orderId, {
      paymentStatus: result.paymentStatus,
      unresolvedAt: now,
      unresolvedBy: adminUid || '',
      updatedAt: now,
    });
  } catch (e) {
    console.warn('Failed to propagate unresolve to nested orders for', orderId, e.message || e);
  }
  return result;
}

// Helper to propagate payment status changes to nested catalogue orders (best-effort)
async function propagateToNestedOrders(paymentOrderId, updates) {
  try {
    const snap = await db.collectionGroup('orders').where('paymentOrderId', '==', paymentOrderId).get();
    if (snap.empty) return;
    const batch = db.batch();
    snap.docs.forEach((d) => {
      try {
        batch.update(d.ref, updates);
      } catch (e) {
        // ignore individual doc failures in preparation; commit may still fail later
      }
    });
    await batch.commit();
  } catch (e) {
    // Non-fatal: log and continue
    console.warn('Failed to propagate payment status to nested orders for', paymentOrderId, e.message || e);
  }
}

module.exports = {
  listPendingUtrOrders,
  listReviewOrders,
  listHistoryOrders,
  confirmOrder,
  // Export wrapper that also propagates to nested orders
  unresolveReconciledOrder: unresolveAndPropagate,
};
