const admin = require("firebase-admin");
const path = require("path");

// Safely initialize Firebase Admin if not already initialized by notificationService
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));
    }
} catch (error) {
    console.error("⚠️ WARNING: Firebase Credentials not found for Analytics Service.");
}

if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin Initialized (Analytics Service)");
}

const db = admin.apps.length ? admin.firestore() : null;

/**
 * Helper to get today's date string (YYYY-MM-DD)
 */
function getTodayStr() {
    const date = new Date();
    return date.toISOString().split("T")[0];
}

/**
 * Track a unique daily visitor for a store.
 * @param {string} storeHandle 
 */
exports.trackVisit = async (storeHandle) => {
    if (!db) return;
    try {
        const today = getTodayStr();
        // Use a daily document to prevent a single document from overflowing write limits
        const ref = db.collection("analytics").doc(storeHandle).collection("daily").doc(today);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(ref);
            if (!doc.exists) {
                transaction.set(ref, { visits: 1, date: today });
            } else {
                transaction.update(ref, { visits: admin.firestore.FieldValue.increment(1) });
            }
        });
    } catch (error) {
        console.error("Error tracking visit:", error);
    }
};

/**
 * Track a completed order.
 * @param {string} storeHandle 
 * @param {object} orderData { gmv, items: [{id, name, qty, price}], buyerEmail, buyerName }
 */
exports.trackOrder = async (storeHandle, orderData) => {
    if (!db) return;
    try {
        const today = getTodayStr();
        const gmv = Number(orderData.gmv) || 0;

        // 1. Update Daily Stats (Visits, Orders, GMV)
        const dailyRef = db.collection("analytics").doc(storeHandle).collection("daily").doc(today);
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(dailyRef);
            if (!doc.exists) {
                transaction.set(dailyRef, { orders: 1, gmv: gmv, date: today, visits: 0 });
            } else {
                transaction.update(dailyRef, {
                    orders: admin.firestore.FieldValue.increment(1),
                    gmv: admin.firestore.FieldValue.increment(gmv)
                });
            }
        });

        // 2. Update Lifetime Store Analytics (Totals)
        const storeAnalyticsRef = db.collection("analytics").doc(storeHandle);
        await storeAnalyticsRef.set({
            totalOrders: admin.firestore.FieldValue.increment(1),
            totalGMV: admin.firestore.FieldValue.increment(gmv)
        }, { merge: true });

        // 3. Track Top Buyers (LTV)
        if (orderData.buyerEmail) {
            const sanitizedEmail = orderData.buyerEmail.replace(/[\.\#\$\[\]]/g, "_"); // Firestore keys can't contain dots
            const buyerRef = db.collection("analytics").doc(storeHandle).collection("topBuyers").doc(sanitizedEmail);

            const buyerDoc = await buyerRef.get();
            if (!buyerDoc.exists) {
                await buyerRef.set({
                    name: orderData.buyerName || "Unknown",
                    email: orderData.buyerEmail,
                    ltv: gmv, // Lifetime value
                    orderCount: 1,
                    lastOrderDate: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await buyerRef.update({
                    ltv: admin.firestore.FieldValue.increment(gmv),
                    orderCount: admin.firestore.FieldValue.increment(1),
                    lastOrderDate: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        // 4. Track Top Products
        if (orderData.items && Array.isArray(orderData.items)) {
            const batch = db.batch();
            for (const item of orderData.items) {
                if (!item.id) continue;
                const productRef = db.collection("analytics").doc(storeHandle).collection("topProducts").doc(item.id);
                batch.set(productRef, {
                    name: item.name || "Unknown Product",
                    soldCount: admin.firestore.FieldValue.increment(item.qty || 1),
                    revenueGenerated: admin.firestore.FieldValue.increment((item.qty || 1) * (item.price || 0))
                }, { merge: true });
            }
            await batch.commit();
        }

    } catch (error) {
        console.error("Error tracking order:", error);
    }
};

/**
 * Track an abandoned cart.
 * @param {string} storeHandle 
 * @param {number} cartValue
 */
exports.trackAbandonedCart = async (storeHandle, cartValue) => {
    if (!db) return;
    try {
        const today = getTodayStr();
        const value = Number(cartValue) || 0;

        const dailyRef = db.collection("analytics").doc(storeHandle).collection("daily").doc(today);
        await dailyRef.set({
            abandonedCarts: admin.firestore.FieldValue.increment(1),
            abandonedValue: admin.firestore.FieldValue.increment(value)
        }, { merge: true });

    } catch (error) {
        console.error("Error tracking abandoned cart:", error);
    }
};
