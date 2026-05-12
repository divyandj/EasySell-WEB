/**
 * firestore-migration.js
 * 
 * One-off script to populate missing sellerId and storeHandle fields in Firestore orders.
 * 
 * Prerequisites:
 * - Firebase Admin SDK configured with service account key
 * - Node.js 14+
 * - Run: node firestore-migration.js
 * 
 * Usage:
 *   DRY_RUN=true node firestore-migration.js  (preview changes, no writes)
 *   node firestore-migration.js                (apply changes)
 */

const admin = require('firebase-admin');
const path = require('path');

// =============================================
// Configuration
// =============================================

const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 100; // Firestore batch write limit
const DELAY_MS = 1000; // Delay between batches to avoid rate limiting

// =============================================
// Initialize Firebase
// =============================================

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  || path.join(__dirname, 'easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
}

const db = admin.firestore();

// =============================================
// Migration Functions
// =============================================

/**
 * Get seller storeHandle from user document
 */
async function getSellerStoreHandle(sellerId) {
  try {
    const userDoc = await db.collection('users').doc(sellerId).get();
    if (userDoc.exists) {
      return userDoc.data().storeHandle || null;
    }
  } catch (err) {
    console.error(`Error fetching user ${sellerId}:`, err.message);
  }
  return null;
}

/**
 * Migrate catalogue orders (nested under catalogues/{catalogueId}/orders)
 */
async function migrateCatalogueOrders() {
  console.log('\n=== Migrating Catalogue Orders ===');
  
  let totalScanned = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  try {
    const catalogues = await db.collection('catalogues').get();
    console.log(`Found ${catalogues.size} catalogues`);

    for (const catalogueDoc of catalogues.docs) {
      const catalogueId = catalogueDoc.id;
      const catalogueData = catalogueDoc.data();

      if (!catalogueData.userId) {
        console.warn(`  Catalogue ${catalogueId} has no userId, skipping`);
        continue;
      }

      const ordersRef = db.collection('catalogues').doc(catalogueId).collection('orders');
      const orders = await ordersRef.get();

      if (orders.empty) continue;

      console.log(`  Catalogue ${catalogueId}: ${orders.size} orders`);

      for (const orderDoc of orders.docs) {
        totalScanned++;
        const orderData = orderDoc.data();
        const updates = {};
        let needsUpdate = false;

        // Ensure sellerId is set from catalogue's userId
        if (!orderData.sellerId && catalogueData.userId) {
          updates.sellerId = catalogueData.userId;
          needsUpdate = true;
        }

        // Ensure storeHandle is set (derive from seller or existing value)
        if (!orderData.storeHandle) {
          const storeHandle = catalogueData.storeHandle || 
            (catalogueData.userId ? await getSellerStoreHandle(catalogueData.userId) : null);
          if (storeHandle) {
            updates.storeHandle = storeHandle;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          if (DRY_RUN) {
            console.log(`    [DRY] Order ${orderDoc.id}: would add fields`, Object.keys(updates));
          } else {
            try {
              await ordersRef.doc(orderDoc.id).update(updates);
              console.log(`    ✓ Order ${orderDoc.id}: updated with fields`, Object.keys(updates));
              totalUpdated++;
            } catch (err) {
              console.error(`    ✗ Order ${orderDoc.id}: ${err.message}`);
              totalErrors++;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error migrating catalogue orders:', err.message);
    totalErrors++;
  }

  console.log(`\nCatalogue Orders Summary:`);
  console.log(`  Scanned: ${totalScanned}`);
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  Errors: ${totalErrors}`);

  return { totalScanned, totalUpdated, totalErrors };
}

/**
 * Migrate root orders (payment orders in root /orders collection)
 */
async function migrateRootOrders() {
  console.log('\n=== Migrating Root Payment Orders ===');
  
  let totalScanned = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  try {
    const ordersRef = db.collection('orders');
    let lastDoc = null;
    let hasMore = true;

    while (hasMore) {
      let query = ordersRef.limit(BATCH_SIZE);
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const orders = await query.get();
      hasMore = orders.size === BATCH_SIZE;

      for (const orderDoc of orders.docs) {
        totalScanned++;
        const orderData = orderDoc.data();
        const updates = {};
        let needsUpdate = false;

        // Ensure storeHandle is present
        if (!orderData.storeHandle) {
          console.warn(`    ⚠ Order ${orderDoc.id}: missing storeHandle (cannot auto-populate root orders)`);
          // Root orders should have storeHandle set by backend; flag for manual review
        }

        if (needsUpdate) {
          if (DRY_RUN) {
            console.log(`    [DRY] Order ${orderDoc.id}: would update fields`, Object.keys(updates));
          } else {
            try {
              await orderDoc.ref.update(updates);
              console.log(`    ✓ Order ${orderDoc.id}: updated`);
              totalUpdated++;
            } catch (err) {
              console.error(`    ✗ Order ${orderDoc.id}: ${err.message}`);
              totalErrors++;
            }
          }
        }
      }

      if (hasMore) {
        lastDoc = orders.docs[orders.docs.length - 1];
        console.log(`  Processed batch (${orders.size}), delaying ${DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  } catch (err) {
    console.error('Error migrating root orders:', err.message);
    totalErrors++;
  }

  console.log(`\nRoot Orders Summary:`);
  console.log(`  Scanned: ${totalScanned}`);
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  Errors: ${totalErrors}`);

  return { totalScanned, totalUpdated, totalErrors };
}

/**
 * Verify all users have storeHandle set
 */
async function verifyUserStoreHandles() {
  console.log('\n=== Verifying User storeHandle Fields ===');
  
  let totalUsers = 0;
  let missingStoreHandle = 0;

  try {
    const usersRef = db.collection('users');
    const users = await usersRef.get();

    for (const userDoc of users.docs) {
      totalUsers++;
      const userData = userDoc.data();
      if (!userData.storeHandle) {
        missingStoreHandle++;
        console.warn(`  ⚠ User ${userDoc.id}: missing storeHandle`);
      }
    }
  } catch (err) {
    console.error('Error verifying user storeHandle:', err.message);
  }

  console.log(`\nUser storeHandle Summary:`);
  console.log(`  Total users: ${totalUsers}`);
  console.log(`  Missing storeHandle: ${missingStoreHandle}`);
  
  if (missingStoreHandle > 0) {
    console.warn(`  ⚠ WARNING: ${missingStoreHandle} users are missing storeHandle. Ensure backend sets this via setCustomUserClaims().`);
  }

  return { totalUsers, missingStoreHandle };
}

// =============================================
// Main Execution
// =============================================

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Firestore Data Migration Script       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\nMode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (changes will be written)'}`);
  console.log(`Service Account: ${serviceAccountPath}\n`);

  const results = {
    catalogueOrders: {},
    rootOrders: {},
    userVerification: {}
  };

  try {
    // Step 1: Verify user storeHandle fields
    results.userVerification = await verifyUserStoreHandles();

    // Step 2: Migrate catalogue orders
    results.catalogueOrders = await migrateCatalogueOrders();

    // Step 3: Migrate root orders (read-only, no auto-fix for these)
    results.rootOrders = await migrateRootOrders();

    // Summary
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Migration Complete                    ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`\nCatalogue Orders:`);
    console.log(`  Scanned: ${results.catalogueOrders.totalScanned}`);
    console.log(`  Updated: ${results.catalogueOrders.totalUpdated}`);
    console.log(`  Errors: ${results.catalogueOrders.totalErrors}`);

    console.log(`\nRoot Orders:`);
    console.log(`  Scanned: ${results.rootOrders.totalScanned}`);
    console.log(`  ⚠ Warnings: ${results.rootOrders.totalErrors} (missing storeHandle)`);

    console.log(`\nNext steps:`);
    console.log(`  1. Review any warnings above for missing storeHandle in root orders`);
    console.log(`  2. Run: firebase deploy --only firestore:rules,firestore:indexes`);
    console.log(`  3. Test app flows in emulator: firebase emulators:start --only firestore,auth`);
    console.log(`  4. Monitor Logcat for PERMISSION_DENIED errors after deploying to production`);

    process.exit(0);
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    process.exit(1);
  }
}

main();
