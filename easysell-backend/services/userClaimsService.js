const { getAdmin, getDb } = require('../utils/firebaseAdmin');
const { buildError } = require('../constants/paymentErrors');

const admin = getAdmin();
const db = getDb();

async function setStoreHandleClaim(uid, storeHandle, role = 'seller') {
  if (!uid) throw buildError('INVALID_INPUT', { message: 'uid required' });
  if (!storeHandle) throw buildError('INVALID_INPUT', { message: 'storeHandle required' });

  const scoped = String(storeHandle).trim().toLowerCase();

  // Set custom claim on Firebase Auth
  await admin.auth().setCustomUserClaims(uid, { storeHandle: scoped, role });

  // Also update users collection profile for backend lookups
  const userRef = db.collection('users').doc(uid);
  await userRef.set({ storeHandle: scoped, userType: role }, { merge: true });

  // Return a small confirmation object
  return { uid, storeHandle: scoped, role };
}

module.exports = {
  setStoreHandleClaim,
};
