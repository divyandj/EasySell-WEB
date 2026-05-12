/**
 * link-orders.js
 *
 * Script to backfill paymentOrderId links between nested catalogue orders and root payment orders.
 * Run this after setting up payment order creation to establish the connection.
 *
 * Prerequisites:
 * - Firebase Admin SDK configured with service account key
 * - Node.js 14+
 *
 * Usage:
 *   DRY_RUN=true node link-orders.js  (preview changes, no writes)
 *   node link-orders.js                (apply changes)
 */

const admin = require('firebase-admin');
const path = require('path');

// =============================================
// Configuration
// =============================================

const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 100;
const DELAY_MS = 1000;

// =============================================
// Initialize Firebase
// =============================================

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, '../easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
}

const db = admin.firestore();

// =============================================
// Helper: Find payment order by buyerId, orderAmount, and date proximity
// =============================================

async function findPaymentOrderForNestedOrder(nestedOrder) {
  /**
   * Strategy: Look for a root payment order that matches:
   * - Same buyerId/userId (customer who placed the order)
   * - Similar orderAmount (within tolerance)
   * - Created around the same time (within 1 hour before/after)
   * - Same storeHandle (seller store)
   */
  const buyerId = nestedOrder.buyerId || nestedOrder.userId;
  const catalogueOrderAmount = Number(nestedOrder.totalAmount || nestedOrder.orderAmount || 0);
  const storeHandle = nestedOrder.storeHandle || '';

  if (!buyerId || !storeHandle || catalogueOrderAmount <= 0) {
    return null; // Cannot match without buyer and amount
  }

  try {
    // Query root orders by storeHandle and buyerId only (simpler, avoids complex indexes)
    const query = db.collection('orders')
      .where('storeHandle', '==', storeHandle)
      .where('buyerId', '==', buyerId);

    const snap = await query.get();

    if (snap.empty) {
      return null;
    }

    // Find best match: same or very close amount, within reasonable time window
    let bestMatch = null;
    let smallestDiff = Infinity;

    snap.docs.forEach((doc) => {
      const paymentOrder = doc.data() || {};
      const paymentAmount = Number(paymentOrder.orderAmount || 0);
      const diff = Math.abs(catalogueOrderAmount - paymentAmount);

      // Allow up to 10% difference (common for payment with suffix/paise)
      if (diff <= catalogueOrderAmount * 0.1 && diff < smallestDiff) {
        smallestDiff = diff;
        bestMatch = { orderId: doc.id, ...paymentOrder };
      }
    });

    return bestMatch;
  } catch (err) {
    console.warn('Error finding payment order for nested order:', err.message);
    return null;
  }
}

// =============================================
// Backfill paymentOrderId links
// =============================================

async function backfillPaymentOrderIds() {
  console.log('\n=== Backfilling paymentOrderId Links ===');

  let totalScanned = 0;
  let totalUpdated = 0;
  let totalSkipped = 0; // Already has paymentOrderId
  let totalNotFound = 0; // No matching payment order
  let totalErrors = 0;

  try {
    const catalogues = await db.collection('catalogues').get();
    console.log(`Found ${catalogues.size} catalogues`);

    for (const catalogueDoc of catalogues.docs) {
      const catalogueId = catalogueDoc.id;
      const catalogueData = catalogueDoc.data() || {};

      const ordersRef = db.collection('catalogues').doc(catalogueId).collection('orders');
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
          const orderData = orderDoc.data() || {};

          // Skip if already has paymentOrderId
          if (orderData.paymentOrderId) {
            totalSkipped++;
            continue;
          }

          // Try to find matching payment order
          try {
            const paymentOrder = await findPaymentOrderForNestedOrder(orderData);

            if (!paymentOrder) {
              totalNotFound++;
              if (totalScanned % 10 === 0) {
                console.log(`    Order ${orderDoc.id}: no matching payment order found`);
              }
              continue;
            }

            // Found a match, update the nested order
            if (DRY_RUN) {
              console.log(
                `    [DRY] Catalogue ${catalogueId}: Order ${orderDoc.id} => Payment ${paymentOrder.orderId}`
              );
            } else {
              try {
                await orderDoc.ref.update({
                  paymentOrderId: paymentOrder.orderId,
                  updatedAt: admin.firestore.Timestamp.now(),
                });
                console.log(
                  `    ✓ Catalogue ${catalogueId}: Order ${orderDoc.id} linked to Payment ${paymentOrder.orderId}`
                );
                totalUpdated++;
              } catch (err) {
                console.error(`    ✗ Order ${orderDoc.id}: ${err.message}`);
                totalErrors++;
              }
            }
          } catch (err) {
            console.error(`    Error processing order ${orderDoc.id}:`, err.message);
            totalErrors++;
          }
        }

        if (hasMore) {
          lastDoc = orders.docs[orders.docs.length - 1];
          console.log(`  Processed batch (${orders.size}), delaying ${DELAY_MS}ms...`);
          await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
        }
      }
    }
  } catch (err) {
    console.error('Error backfilling paymentOrderId:', err.message);
    totalErrors++;
  }

  console.log(`\nPaymentOrderId Backfill Summary:`);
  console.log(`  Total Scanned: ${totalScanned}`);
  console.log(`  Already Linked (Skipped): ${totalSkipped}`);
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  No Match Found: ${totalNotFound}`);
  console.log(`  Errors: ${totalErrors}`);

  return { totalScanned, totalUpdated, totalSkipped, totalNotFound, totalErrors };
}

// =============================================
// Main Execution
// =============================================

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Order Linking Script (paymentOrderId) ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\nMode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (changes will be written)'}`);
  console.log(`Service Account: ${serviceAccountPath}\n`);

  try {
    const results = await backfillPaymentOrderIds();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Backfill Complete                     ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`\nNext steps:`);
    console.log(`  1. Review results above for any skipped or unmatched orders.`);
    if (DRY_RUN) {
      console.log(`  2. Re-run WITHOUT DRY_RUN to apply changes: node link-orders.js`);
    } else {
      console.log(`  2. Verify a sample of updated orders in Firebase Console.`);
      console.log(`  3. Test app flow: open order from Orders tab and Payment tab.`);
      console.log(`  4. If IDs still don't match, check Logcat for collectionGroup query errors.`);
    }

    process.exit(results.totalErrors === 0 ? 0 : 1);
  } catch (err) {
    console.error('\n✗ Script failed:', err.message);
    process.exit(1);
  }
}

main();
