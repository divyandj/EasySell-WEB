const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const args = new Set(process.argv.slice(2));

const backendDir = path.resolve(__dirname, '..');
const candidateCredentialPaths = [
  path.join(backendDir, 'serviceAccountKey.json'),
  path.join(backendDir, 'easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json'),
];

function ensureFirebaseCredentialEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return;

  for (const candidate of candidateCredentialPaths) {
    if (fs.existsSync(candidate)) {
      process.env.FIREBASE_SERVICE_ACCOUNT = fs.readFileSync(candidate, 'utf8');
      return;
    }
  }

  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT not set and no local service account JSON found in easysell-backend/.'
  );
}

function getApiKey() {
  const gsPath = path.resolve(backendDir, '../../app/google-services.json');
  const gs = JSON.parse(fs.readFileSync(gsPath, 'utf8'));
  const apiKey = gs?.client?.[0]?.api_key?.[0]?.current_key;
  if (!apiKey) throw new Error('API key not found in app/google-services.json');
  return apiKey;
}

async function idToken(uid, claims, apiKey) {
  const customToken = await admin.auth().createCustomToken(uid, claims);
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.idToken;
}

async function call(base, name, method, route, token, body, expected = [200]) {
  const resp = await fetch(`${base}${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await resp.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  const ok = expected.includes(resp.status);
  console.log(`\n[${name}] ${method} ${route}`);
  console.log(`status=${resp.status} expected=${expected.join(',')}`);
  console.log(JSON.stringify(json, null, 2));

  if (!ok) {
    throw new Error(`${name} failed with status ${resp.status}`);
  }

  return json;
}

async function ensureUserProfile(uid, userType, storeHandle) {
  const db = admin.firestore();
  const now = new Date();
  await db.collection('users').doc(uid).set({
    userType,
    storeHandle,
    ownerName: uid,
    updatedAt: now,
    createdAt: now,
  }, { merge: true });
}

async function main() {
  if (args.has('--help') || args.has('-h')) {
    console.log('Usage: npm run smoke:payment');
    console.log('Optional env: SMOKE_BASE_URL=http://127.0.0.1:3001');
    console.log('Requires backend server to be running and Firebase credentials configured.');
    return;
  }

  ensureFirebaseCredentialEnv();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  }

  const apiKey = getApiKey();
  const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3001';

  try {
    const health = await fetch(`${base}/`);
    if (!health.ok) {
      throw new Error(`Backend responded with status ${health.status}`);
    }
  } catch (error) {
    throw new Error(`Backend is not reachable at ${base}. Start server.js before running smoke tests.`);
  }

  const runId = Date.now();
  const storeHandle = `smoke-${runId}`;
  const otherStoreHandle = `smoke-other-${runId}`;
  const adminUid = `smoke-admin-${runId}`;
  const otherAdminUid = `smoke-admin-other-${runId}`;
  const buyerUid = `smoke-buyer-${runId}`;

  await Promise.all([
    ensureUserProfile(adminUid, 'admin', storeHandle),
    ensureUserProfile(otherAdminUid, 'admin', otherStoreHandle),
    ensureUserProfile(buyerUid, 'buyer', storeHandle),
  ]);

  const adminToken = await idToken(adminUid, { role: 'admin', userType: 'admin', storeHandle }, apiKey);
  const otherAdminToken = await idToken(otherAdminUid, { role: 'admin', userType: 'admin', storeHandle: otherStoreHandle }, apiKey);
  const buyerToken = await idToken(buyerUid, { role: 'buyer', userType: 'buyer', storeHandle }, apiKey);

  const account1 = await call(base, 'create-account-primary', 'POST', '/api/admin/payment/buckets', adminToken, {
    vendorName: 'Smoke Vendor Primary',
    vendorUpiId: `smoke${runId}@upi`,
    qrImageUrl: 'https://example.com/qr-primary.png',
    qrType: 'UPI',
    priority: 1,
    limitAmount: 2000,
  }, [200]);
  const account1Id = account1?.data?.bucketId;
  await call(base, 'activate-account-primary', 'PATCH', `/api/admin/payment/buckets/${account1Id}/status`, adminToken, { status: 'ACTIVE' }, [200]);

  const order1 = await call(base, 'create-order', 'POST', '/api/payment/orders', buyerToken, {
    buyerId: buyerUid,
    orderAmount: 1234,
  }, [200]);
  const order1Id = order1?.data?.orderId;

  await call(base, 'get-order-status', 'GET', `/api/payment/orders/${order1Id}/status`, buyerToken, null, [200]);

  const utr1 = String(runId).slice(-12).padStart(12, '1');
  const utr2 = String(runId + 1).slice(-12).padStart(12, '2');
  const utr3 = String(runId + 2).slice(-12).padStart(12, '3');
  const utr4 = String(runId + 3).slice(-12).padStart(12, '4');

  await call(base, 'submit-utr', 'POST', `/api/payment/orders/${order1Id}/submit-utr`, buyerToken, { utrNumber: utr1 }, [200]);
  await call(base, 'pending-list-page1', 'GET', '/api/admin/payment/orders/pending?limit=1', adminToken, null, [200]);
  await call(base, 'correct-utr-once', 'POST', `/api/payment/orders/${order1Id}/correct-utr`, buyerToken, { utrNumber: utr2 }, [200]);
  await call(base, 'correct-utr-second-time', 'POST', `/api/payment/orders/${order1Id}/correct-utr`, buyerToken, { utrNumber: '999999999999' }, [409]);
  await call(base, 'confirm-reconcile', 'POST', `/api/admin/payment/orders/${order1Id}/confirm`, adminToken, { action: 'RECONCILE' }, [200]);
  await call(base, 'history-list', 'GET', '/api/admin/payment/orders/history?limit=5', adminToken, null, [200]);

  const order2 = await call(base, 'create-order-for-cancel', 'POST', '/api/payment/orders', buyerToken, {
    buyerId: buyerUid,
    orderAmount: 200,
  }, [200]);
  const order2Id = order2?.data?.orderId;
  await call(base, 'cancel-pending-order', 'POST', `/api/payment/orders/${order2Id}/cancel`, buyerToken, {}, [200]);

  const order3 = await call(base, 'create-order-for-dispute', 'POST', '/api/payment/orders', buyerToken, {
    buyerId: buyerUid,
    orderAmount: 300,
  }, [200]);
  const order3Id = order3?.data?.orderId;
  await call(base, 'submit-utr-order3', 'POST', `/api/payment/orders/${order3Id}/submit-utr`, buyerToken, { utrNumber: utr3 }, [200]);
  await call(base, 'confirm-dispute', 'POST', `/api/admin/payment/orders/${order3Id}/confirm`, adminToken, { action: 'DISPUTE' }, [200]);
  await call(base, 'confirm-disputed-without-reopen', 'POST', `/api/admin/payment/orders/${order3Id}/confirm`, adminToken, { action: 'RECONCILE' }, [409]);
  await call(base, 'reopen-disputed', 'POST', `/api/admin/payment/orders/${order3Id}/reopen`, adminToken, {}, [200]);
  await call(base, 'review-list', 'GET', '/api/admin/payment/orders/review?limit=5', adminToken, null, [200]);

  const sameUpiAccount = await call(base, 'create-account-same-upi', 'POST', '/api/admin/payment/buckets', adminToken, {
    vendorName: 'Smoke Vendor Duplicate',
    vendorUpiId: `smoke${runId}@upi`,
    qrImageUrl: 'https://example.com/qr-duplicate.png',
    qrType: 'UPI',
    priority: 3,
    limitAmount: 4000,
  }, [200]);
  const sameUpiAccountId = sameUpiAccount?.data?.bucketId;
  await call(base, 'activate-same-upi-account-blocked', 'PATCH', `/api/admin/payment/buckets/${sameUpiAccountId}/status`, adminToken, { status: 'ACTIVE' }, [409]);

  const account2 = await call(base, 'create-account-secondary', 'POST', '/api/admin/payment/buckets', adminToken, {
    vendorName: 'Smoke Vendor Secondary',
    vendorUpiId: `smoke-secondary-${runId}@upi`,
    qrImageUrl: 'https://example.com/qr-secondary.png',
    qrType: 'UPI',
    priority: 2,
    limitAmount: 5000,
  }, [200]);
  const account2Id = account2?.data?.bucketId;
  await call(base, 'activate-account-secondary', 'PATCH', `/api/admin/payment/buckets/${account2Id}/status`, adminToken, { status: 'ACTIVE' }, [200]);

  await call(base, 'cross-store-update-blocked', 'PATCH', `/api/admin/payment/buckets/${account1Id}/status`, otherAdminToken, { status: 'PAUSED' }, [403]);
  await call(base, 'pause-primary-account', 'PATCH', `/api/admin/payment/buckets/${account1Id}/status`, adminToken, { status: 'PAUSED' }, [200]);
  await call(base, 'reactivate-primary-account', 'PATCH', `/api/admin/payment/buckets/${account1Id}/status`, adminToken, { status: 'ACTIVE' }, [200]);

  const order4 = await call(base, 'create-fallback-order', 'POST', '/api/payment/orders', buyerToken, {
    buyerId: buyerUid,
    orderAmount: 900,
  }, [200]);
  const order4Id = order4?.data?.orderId;
  await call(base, 'submit-utr-order4', 'POST', `/api/payment/orders/${order4Id}/submit-utr`, buyerToken, { utrNumber: utr4 }, [200]);
  await call(base, 'confirm-reconcile-order4', 'POST', `/api/admin/payment/orders/${order4Id}/confirm`, adminToken, { action: 'RECONCILE' }, [200]);

  await call(base, 'create-too-large-order', 'POST', '/api/payment/orders', buyerToken, {
    buyerId: buyerUid,
    orderAmount: 999999,
  }, [409]);

  console.log('\nSMOKE TEST COMPLETED');
}

main().catch((error) => {
  console.error('\nSMOKE TEST FAILED');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
