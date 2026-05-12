#!/usr/bin/env node
/**
 * One-off migration script to set `storeHandle` custom claim for seller users.
 * Usage:
 *  node scripts/setSellerClaims.js --dry-run
 *  node scripts/setSellerClaims.js --limit=50
 */

const { getAdmin, getDb } = require('../utils/firebaseAdmin');
const admin = getAdmin();
const db = getDb();

const argv = require('minimist')(process.argv.slice(2));
const DRY = Boolean(argv['dry-run']);
const LIMIT = Number(argv.limit) || 0;

async function main() {
  console.log('Migration start. dry-run=', DRY, 'limit=', LIMIT || 'none');

  // Query users that are sellers. This assumes sellers are marked with userType: 'seller'
  let q = db.collection('users').where('userType', '==', 'seller');
  if (LIMIT) q = q.limit(LIMIT);

  const snap = await q.get();
  console.log('Found', snap.size, 'seller user docs');

  let processed = 0;
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const uid = doc.id;
    const storeHandle = String(data.storeHandle || '').trim().toLowerCase();

    if (!storeHandle) {
      console.warn(`skip ${uid}: no storeHandle in users/${uid}`);
      continue;
    }

    processed++;

    let currentClaims = {};
    try {
      const userRecord = await admin.auth().getUser(uid);
      currentClaims = userRecord.customClaims || {};
    } catch (err) {
      console.warn(`warning: could not fetch auth user ${uid}: ${err.message}`);
    }

    if (String(currentClaims.storeHandle || '').trim().toLowerCase() === storeHandle && String(currentClaims.role || '').trim().toLowerCase() === 'seller') {
      console.log(`noop ${uid}: claims already set`);
      continue;
    }

    console.log(`${DRY ? '[DRY]' : '[SET]'} ${uid} -> storeHandle=${storeHandle}`);

    if (!DRY) {
      try {
        await admin.auth().setCustomUserClaims(uid, { storeHandle, role: 'seller' });
        await db.collection('users').doc(uid).set({ storeHandle, userType: 'seller' }, { merge: true });
        console.log(`=> updated ${uid}`);
      } catch (err) {
        console.error(`FAILED ${uid}: ${err.message}`);
      }
    }
  }

  console.log('Migration finished. processed=', processed);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(2);
});
