const { getDb } = require('../utils/firebaseAdmin');

const db = getDb();

const RULES = {
  NO_BUCKET_AVAILABLE: 10 * 60 * 1000,
  SUFFIX_POOL_EXHAUSTED: 60 * 60 * 1000,
};

async function shouldSendAlert(storeHandle, alertType) {
  const cooldownMs = RULES[alertType];
  if (!cooldownMs) return true;

  const key = `${storeHandle}__${alertType}`;
  const ref = db.collection('payment_alert_throttle').doc(key);
  const now = Date.now();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const lastSentMs = snap.exists ? Number(snap.data().lastSentMs || 0) : 0;

    if ((now - lastSentMs) < cooldownMs) {
      return false;
    }

    tx.set(ref, {
      storeHandle,
      alertType,
      lastSentMs: now,
      updatedAt: new Date(),
    }, { merge: true });

    return true;
  });
}

module.exports = {
  shouldSendAlert,
};
