const { getDb } = require('../utils/firebaseAdmin');
const { LEDGER_STATUS } = require('../constants/paymentStatuses');
const { buildError } = require('../constants/paymentErrors');

const db = getDb();

function computeLedgerStatus(totalDebtAmount, settledAmount) {
  if (settledAmount > totalDebtAmount) return LEDGER_STATUS.OVERPAID;
  if (settledAmount === totalDebtAmount) return LEDGER_STATUS.SETTLED;
  if (settledAmount > 0) return LEDGER_STATUS.PARTIAL;
  return LEDGER_STATUS.OPEN;
}

async function listLedgers(storeHandle) {
  const scopedStoreHandle = String(storeHandle || '').trim().toLowerCase();
  if (!scopedStoreHandle) throw buildError('STORE_SCOPE_REQUIRED');

  const snap = await db.collection('debtLedger')
    .where('storeHandle', '==', scopedStoreHandle)
    .get();
  return snap.docs
    .map((d) => ({ ledgerId: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });
}

async function createLedger(payload, storeHandle) {
  const scopedStoreHandle = String(storeHandle || '').trim().toLowerCase();
  const vendorName = String(payload.vendorName || '').trim();
  const totalDebtAmount = Number(payload.totalDebtAmount || 0);
  const agreementRef = String(payload.agreementRef || '').trim();

  if (!scopedStoreHandle) {
    throw buildError('STORE_SCOPE_REQUIRED');
  }

  if (!vendorName || totalDebtAmount <= 0) {
    throw buildError('INVALID_INPUT', { message: 'vendorName and positive totalDebtAmount are required.' });
  }

  const now = new Date();
  const ref = db.collection('debtLedger').doc();
  const doc = {
    vendorName,
    totalDebtAmount,
    settledAmount: 0,
    remainingAmount: totalDebtAmount,
    agreementRef,
    storeHandle: scopedStoreHandle,
    status: LEDGER_STATUS.OPEN,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(doc);
  return { ledgerId: ref.id, ...doc };
}

async function assertLedgerCanCreateBucket(ledgerId, storeHandle) {
  const scopedStoreHandle = String(storeHandle || '').trim().toLowerCase();
  if (!scopedStoreHandle) throw buildError('STORE_SCOPE_REQUIRED');

  const ref = db.collection('debtLedger').doc(ledgerId);
  const snap = await ref.get();
  if (!snap.exists) throw buildError('LEDGER_NOT_FOUND');

  const data = snap.data() || {};
  if (String(data.storeHandle || '').trim().toLowerCase() !== scopedStoreHandle) {
    throw buildError('STORE_SCOPE_MISMATCH');
  }
  if (data.status === LEDGER_STATUS.OVERPAID) {
    throw buildError('LEDGER_OVERPAID_BLOCK');
  }
  return { ref, data };
}

function applyReconcileToLedgerTx(tx, ledgerRef, orderAmount) {
  return tx.get(ledgerRef).then((ledgerSnap) => {
    if (!ledgerSnap.exists) throw buildError('LEDGER_NOT_FOUND');

    const ledger = ledgerSnap.data() || {};
    const totalDebtAmount = Number(ledger.totalDebtAmount || 0);
    const previousStatus = ledger.status || LEDGER_STATUS.OPEN;
    const settledAmount = Number(ledger.settledAmount || 0) + Number(orderAmount || 0);
    const remainingAmount = totalDebtAmount - settledAmount;
    const status = computeLedgerStatus(totalDebtAmount, settledAmount);

    tx.update(ledgerRef, {
      settledAmount,
      remainingAmount,
      status,
      updatedAt: new Date(),
    });

    return {
      ledgerId: ledgerRef.id,
      settledAmount,
      remainingAmount,
      status,
      enteredOverpaid: status === LEDGER_STATUS.OVERPAID && previousStatus !== LEDGER_STATUS.OVERPAID,
    };
  });
}

module.exports = {
  listLedgers,
  createLedger,
  assertLedgerCanCreateBucket,
  applyReconcileToLedgerTx,
};
