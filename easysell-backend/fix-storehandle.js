/**
 * Quick fix: populate storeHandle on all catalogue orders from seller lookup
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
}

const db = admin.firestore();

async function fixCatalogueOrderStoreHandles() {
  console.log('🔧 Fixing catalogue order storeHandles...\n');
  
  let totalScanned = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  try {
    const catalogues = await db.collection('catalogues').get();
    console.log(`Found ${catalogues.size} catalogues`);

    for (const catalogueDoc of catalogues.docs) {
      const catalogueId = catalogueDoc.id;
      const catalogueData = catalogueDoc.data();
      const sellerId = catalogueData.userId;

      if (!sellerId) {
        console.warn(`  ⚠ Catalogue ${catalogueId}: no userId, skipping`);
        continue;
      }

      // Get seller's storeHandle
      const sellerDoc = await db.collection('users').doc(sellerId).get();
      const storeHandle = sellerDoc.exists ? sellerDoc.data().storeHandle : null;

      if (!storeHandle) {
        console.warn(`  ⚠ Seller ${sellerId}: no storeHandle, skipping catalogue ${catalogueId}`);
        continue;
      }

      const ordersRef = db.collection('catalogues').doc(catalogueId).collection('orders');
      const orders = await ordersRef.get();

      if (orders.empty) continue;

      console.log(`  📦 Catalogue ${catalogueId} (seller: ${storeHandle}): ${orders.size} orders`);

      for (const orderDoc of orders.docs) {
        totalScanned++;
        const orderData = orderDoc.data();

        if (!orderData.storeHandle) {
          try {
            await ordersRef.doc(orderDoc.id).update({ storeHandle });
            console.log(`    ✓ Order ${orderDoc.id}: added storeHandle="${storeHandle}"`);
            totalUpdated++;
          } catch (err) {
            console.error(`    ✗ Order ${orderDoc.id}: ${err.message}`);
            totalErrors++;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
    totalErrors++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Scanned: ${totalScanned}`);
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  Errors: ${totalErrors}`);

  if (totalUpdated > 0) {
    console.log(`\n✅ Successfully updated ${totalUpdated} orders with storeHandle!`);
  }

  process.exit(0);
}

fixCatalogueOrderStoreHandles();
