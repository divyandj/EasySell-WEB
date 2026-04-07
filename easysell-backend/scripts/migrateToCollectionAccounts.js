const fs = require('fs');
const path = require('path');
const { getDb, getAdmin } = require('../utils/firebaseAdmin');

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const DELETE_LEDGERS = args.has('--delete-ledgers');
const EXPORT_LEDGER = args.has('--export') || DELETE_LEDGERS;

const admin = getAdmin();
const db = getDb();

function printUsage() {
  console.log('Collection Accounts migration helper');
  console.log('Usage:');
  console.log('  node scripts/migrateToCollectionAccounts.js                # dry-run (default)');
  console.log('  node scripts/migrateToCollectionAccounts.js --apply        # apply reference cleanup');
  console.log('  node scripts/migrateToCollectionAccounts.js --apply --delete-ledgers --export');
}

function hasField(data, key) {
  return Object.prototype.hasOwnProperty.call(data || {}, key);
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function serializeForJson(value) {
  if (value == null) return value;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map((item) => serializeForJson(item));
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach((key) => {
      out[key] = serializeForJson(value[key]);
    });
    return out;
  }
  return value;
}

async function batchUpdateDeleteField(docs, fieldName) {
  if (!docs.length) return;
  const chunks = chunkArray(docs, 400);
  for (const docsChunk of chunks) {
    const batch = db.batch();
    docsChunk.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        [fieldName]: admin.firestore.FieldValue.delete(),
      });
    });
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }
}

async function batchDeleteDocs(docs) {
  if (!docs.length) return;
  const chunks = chunkArray(docs, 400);
  for (const docsChunk of chunks) {
    const batch = db.batch();
    docsChunk.forEach((docSnap) => batch.delete(docSnap.ref));
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }
}

async function exportDebtLedgerDocs(ledgerDocs) {
  if (!ledgerDocs.length) {
    console.log('No debtLedger docs to export.');
    return null;
  }

  const exportDir = path.join(__dirname, 'exports');
  fs.mkdirSync(exportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(exportDir, `debtLedger-backup-${timestamp}.json`);
  const payload = ledgerDocs.map((docSnap) => ({
    id: docSnap.id,
    ...serializeForJson(docSnap.data() || {}),
  }));

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  return outPath;
}

async function migrate() {
  if (args.has('--help') || args.has('-h')) {
    printUsage();
    return;
  }

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Delete debtLedger collection: ${DELETE_LEDGERS ? 'YES' : 'NO'}`);

  const [ordersSnap, bucketsSnap, ledgersSnap] = await Promise.all([
    db.collection('orders').get(),
    db.collection('buckets').get(),
    db.collection('debtLedger').get(),
  ]);

  const ordersWithDebtLedgerId = ordersSnap.docs.filter((docSnap) => hasField(docSnap.data(), 'debtLedgerId'));
  const bucketsWithDebtLedgerId = bucketsSnap.docs.filter((docSnap) => hasField(docSnap.data(), 'debtLedgerId'));
  const ledgerDocs = ledgersSnap.docs;

  console.log(`orders with debtLedgerId field: ${ordersWithDebtLedgerId.length}`);
  console.log(`buckets with debtLedgerId field: ${bucketsWithDebtLedgerId.length}`);
  console.log(`debtLedger docs: ${ledgerDocs.length}`);

  if (EXPORT_LEDGER) {
    const exportPath = await exportDebtLedgerDocs(ledgerDocs);
    if (exportPath) {
      console.log(`debtLedger export saved: ${exportPath}`);
    }
  }

  if (!APPLY) {
    console.log('Dry-run completed. Re-run with --apply to execute updates.');
    return;
  }

  await batchUpdateDeleteField(ordersWithDebtLedgerId, 'debtLedgerId');
  await batchUpdateDeleteField(bucketsWithDebtLedgerId, 'debtLedgerId');

  if (DELETE_LEDGERS) {
    await batchDeleteDocs(ledgerDocs);
    console.log(`Deleted debtLedger docs: ${ledgerDocs.length}`);
  }

  console.log('Migration completed successfully.');
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
