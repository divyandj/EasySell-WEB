const admin = require("firebase-admin");
const path = require("path");

// 1. Load the Service Account Key
// Priority:
// 1. Environment Variable (FIREBASE_SERVICE_ACCOUNT) - for Production (Render)
// 2. Local File (serviceAccountKey.json) - for Development
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));
  }
} catch (error) {
  console.error("⚠️ WARNING: Firebase Credentials not found (Enable FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json).");
}

// 2. Initialize Firebase Admin
if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin Initialized");
}

const messaging = admin.messaging();

// --- Helper Functions ---

/**
 * Sends a push notification to the 'admin_orders' topic
 */
async function notifyNewOrder(orderId, amount, customerName) {
  if (!serviceAccount) return;

  const message = {
    notification: {
      title: "🎉 New Order Received!",
      body: `Order #${orderId} from ${customerName} for ₹${amount}`
    },
    data: {
      orderId: String(orderId),
      type: "order"
    },
    topic: "admin_orders"
  };

  try {
    await messaging.send(message);
    console.log(`🔔 Notification sent: New Order ${orderId}`);
  } catch (error) {
    console.error("❌ FCM Error (Order):", error.message);
  }
}

/**
 * Sends a push notification to the 'admin_new_users' topic
 */
async function notifyNewUser(userName, userEmail) {
  if (!serviceAccount) return;

  const message = {
    notification: {
      title: "👤 New User Registered",
      body: `${userName} just joined.`
    },
    data: {
      email: userEmail,
      type: "user"
    },
    topic: "admin_new_users"
  };

  try {
    await messaging.send(message);
    console.log(`🔔 Notification sent: New User ${userEmail}`);
  } catch (error) {
    console.error("❌ FCM Error (User):", error.message);
  }
}

module.exports = { notifyNewOrder, notifyNewUser };