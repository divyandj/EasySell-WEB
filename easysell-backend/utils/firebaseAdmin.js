const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount = null;
let serviceAccountErrors = [];

const candidateCredentialPaths = [
  path.join(__dirname, '../serviceAccountKey.json'),
  path.join(__dirname, '../easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json'),
];

function parseJson(raw, sourceLabel) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    serviceAccountErrors.push(`${sourceLabel}: ${error.message}`);
    return null;
  }
}

function getServiceAccount() {
  if (serviceAccount) return serviceAccount;
  serviceAccountErrors = [];

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = parseJson(process.env.FIREBASE_SERVICE_ACCOUNT, 'FIREBASE_SERVICE_ACCOUNT env var');
    if (serviceAccount) return serviceAccount;
  }

  for (const candidatePath of candidateCredentialPaths) {
    if (!fs.existsSync(candidatePath)) continue;
    const raw = fs.readFileSync(candidatePath, 'utf8');
    serviceAccount = parseJson(raw, path.basename(candidatePath));
    if (serviceAccount) return serviceAccount;
  }

  serviceAccount = null;
  return serviceAccount;
}

function initFirebaseAdmin() {
  if (admin.apps.length) return admin;
  const creds = getServiceAccount();
  if (!creds) {
    const acceptedSources = [
      'FIREBASE_SERVICE_ACCOUNT env var',
      ...candidateCredentialPaths.map((p) => path.basename(p)),
    ].join(', ');
    const parseHint = serviceAccountErrors.length
      ? ` Parse errors: ${serviceAccountErrors.join(' | ')}`
      : '';
    throw new Error(`Firebase Admin credentials not configured. Provide one of: ${acceptedSources}.${parseHint}`);
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
