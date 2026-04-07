const { getDb } = require('../utils/firebaseAdmin');
const { buildError } = require('../constants/paymentErrors');

const db = getDb();

function suffixToDocId(bucketId, suffix) {
  return `${bucketId}_${String(suffix).padStart(2, '0')}`;
}

async function allocateSuffixTx(tx, bucketId) {
  const suffixSnap = await tx.get(
    db.collection('suffixIndex').where('bucketId', '==', bucketId)
  );

  const used = new Set();
  suffixSnap.docs.forEach((doc) => {
    const value = Number(doc.data().suffix);
    if (value >= 1 && value <= 98) used.add(value);
  });

  let selected = null;
  for (let i = 1; i <= 98; i += 1) {
    if (!used.has(i)) {
      selected = i;
      break;
    }
  }

  if (!selected) {
    throw buildError('SUFFIX_POOL_EXHAUSTED');
  }

  return selected;
}

function reserveSuffixTx(tx, bucketId, suffix, orderId) {
  const suffixId = suffixToDocId(bucketId, suffix);
  const suffixRef = db.collection('suffixIndex').doc(suffixId);
  tx.create(suffixRef, {
    bucketId,
    suffix,
    orderId,
    createdAt: new Date(),
  });
  return suffixRef;
}

module.exports = {
  allocateSuffixTx,
  reserveSuffixTx,
  suffixToDocId,
};
