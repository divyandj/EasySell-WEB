const admin = require('firebase-admin');
const path = require('path');

let serviceAccount = null;

function getServiceAccount() {
  if (serviceAccount) return serviceAccount;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
    }
  } catch (error) {
    serviceAccount = null;
  }
  return serviceAccount;
}

function initFirebaseAdmin() {
  if (admin.apps.length) return admin;
  const creds = getServiceAccount();
  if (!creds) {
    throw new Error('Firebase Admin credentials not configured.');
  }
  admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
  return admin;
}

function getAdmin() {
  return initFirebaseAdmin();
}

function getDb() {
  return getAdmin().firestore();
}

function getMessaging() {
  return getAdmin().messaging();
}

module.exports = {
  getAdmin,
  getDb,
  getMessaging,
};
