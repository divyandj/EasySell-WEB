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
  const adminUid = `smoke-admin-${runId}`;
  const buyerUid = `smoke-buyer-${runId}`;

  const adminToken = await idToken(adminUid, { role: 'admin', userType: 'admin', storeHandle }, apiKey);
  const buyerToken = await idToken(buyerUid, { role: 'buyer', userType: 'buyer', storeHandle }, apiKey);

  const ledger = await call(base, 'create-ledger', 'POST', '/api/admin/payment/debt-ledger', adminToken, {
    vendorName: 'Smoke Vendor',
    totalDebtAmount: 5000,
    agreementRef: `AGR-${runId}`,
  }, [200]);
  const ledgerId = ledger?.data?.ledgerId;

  const bucket = await call(base, 'create-bucket', 'POST', '/api/admin/payment/buckets', adminToken, {
    vendorName: 'Smoke Vendor',
    vendorUpiId: `smoke${runId}@upi`,
    qrImageUrl: 'https://example.com/qr.png',
    qrType: 'UPI',
    priority: 1,
    limitAmount: 10000,
    debtLedgerId: ledgerId,
  }, [200]);
  const bucketId = bucket?.data?.bucketId;

  await call(base, 'activate-bucket', 'PATCH', `/api/admin/payment/buckets/${bucketId}/status`, adminToken, { status: 'ACTIVE' }, [200]);

  const order = await call(base, 'create-order', 'POST', '/api/payment/orders', buyerToken, {
    buyerId: buyerUid,
    orderAmount: 1234,
  }, [200]);
  const orderId = order?.data?.orderId;

  await call(base, 'get-order-status', 'GET', `/api/payment/orders/${orderId}/status`, buyerToken, null, [200]);

  const utr1 = String(runId).slice(-12).padStart(12, '1');
  const utr2 = String(runId + 1).slice(-12).padStart(12, '2');
  const utr3 = String(runId + 2).slice(-12).padStart(12, '3');

  await call(base, 'submit-utr', 'POST', `/api/payment/orders/${orderId}/submit-utr`, buyerToken, { utrNumber: utr1 }, [200]);
  await call(base, 'pending-list-page1', 'GET', '/api/admin/payment/orders/pending?limit=1', adminToken, null, [200]);
  await call(base, 'correct-utr-once', 'POST', `/api/payment/orders/${orderId}/correct-utr`, buyerToken, { utrNumber: utr2 }, [200]);
  await call(base, 'correct-utr-second-time', 'POST', `/api/payment/orders/${orderId}/correct-utr`, buyerToken, { utrNumber: '999999999999' }, [409]);
  await call(base, 'confirm-reconcile', 'POST', `/api/admin/payment/orders/${orderId}/confirm`, adminToken, { action: 'RECONCILE' }, [200]);
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

  const bucket2 = await call(base, 'create-bucket-same-vendor-upi', 'POST', '/api/admin/payment/buckets', adminToken, {
    vendorName: 'Smoke Vendor Backup',
    vendorUpiId: `smoke${runId}@upi`,
    qrImageUrl: 'https://example.com/qr2.png',
    qrType: 'UPI',
    priority: 5,
    limitAmount: 9000,
    debtLedgerId: ledgerId,
  }, [200]);
  const bucket2Id = bucket2?.data?.bucketId;
  await call(base, 'activate-duplicate-vendor-upi', 'PATCH', `/api/admin/payment/buckets/${bucket2Id}/status`, adminToken, { status: 'ACTIVE' }, [409]);

  const smallLedger = await call(base, 'create-small-ledger', 'POST', '/api/admin/payment/debt-ledger', adminToken, {
    vendorName: 'Overpaid Vendor',
    totalDebtAmount: 100,
    agreementRef: `AGR-OVERPAID-${runId}`,
  }, [200]);
  const smallLedgerId = smallLedger?.data?.ledgerId;

  const overpaidBucket = await call(base, 'create-overpaid-bucket', 'POST', '/api/admin/payment/buckets', adminToken, {
    vendorName: 'Overpaid Vendor',
    vendorUpiId: `overpaid${runId}@upi`,
    qrImageUrl: 'https://example.com/qr-overpaid.png',
    qrType: 'UPI',
    priority: 0,
    limitAmount: 2000000,
    debtLedgerId: smallLedgerId,
  }, [200]);
  const overpaidBucketId = overpaidBucket?.data?.bucketId;
  await call(base, 'activate-overpaid-bucket', 'PATCH', `/api/admin/payment/buckets/${overpaidBucketId}/status`, adminToken, { status: 'ACTIVE' }, [200]);

  const order4 = await call(base, 'create-order-for-ledger-overpaid', 'POST', '/api/payment/orders', buyerToken, {
    buyerId: buyerUid,
    orderAmount: 1500000,
  }, [200]);
  const order4Id = order4?.data?.orderId;
  const utr4 = String(runId + 3).slice(-12).padStart(12, '4');
  await call(base, 'submit-utr-order4', 'POST', `/api/payment/orders/${order4Id}/submit-utr`, buyerToken, { utrNumber: utr4 }, [200]);
  await call(base, 'confirm-reconcile-overpaid-ledger', 'POST', `/api/admin/payment/orders/${order4Id}/confirm`, adminToken, { action: 'RECONCILE' }, [200]);

  await call(base, 'create-bucket-overpaid-ledger-blocked', 'POST', '/api/admin/payment/buckets', adminToken, {
    vendorName: 'Overpaid Vendor 2',
    vendorUpiId: `overpaid2${runId}@upi`,
    qrImageUrl: 'https://example.com/qr-overpaid2.png',
    qrType: 'UPI',
    priority: 3,
    limitAmount: 7000,
    debtLedgerId: smallLedgerId,
  }, [409]);

  console.log('\nSMOKE TEST COMPLETED');
}

main().catch((error) => {
  console.error('\nSMOKE TEST FAILED');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
