const { getDb } = require('../utils/firebaseAdmin');

const db = getDb();

async function backfillUserTypeSeller() {
  const usersSnap = await db.collection('users').get();
  if (usersSnap.empty) {
    console.log('No users found.');
    return;
  }

  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchOps = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data() || {};
    const currentType = String(data.userType || '').trim().toLowerCase();

    if (currentType) {
      skipped += 1;
      continue;
    }

    batch.update(doc.ref, { userType: 'seller' });
    batchOps += 1;
    updated += 1;

    if (batchOps >= 450) {
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  console.log(`Backfill complete. Updated: ${updated}, Skipped: ${skipped}`);
}

backfillUserTypeSeller()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
