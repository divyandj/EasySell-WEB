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
 * Sends a push notification to the 'admin_orders_[storeHandle]' topic
 */
async function notifyNewOrder(orderId, catalogueId, amount, customerName, storeHandle) {
  if (!serviceAccount) return;

  const topicName = storeHandle ? `admin_orders_${storeHandle}` : "admin_orders";

  const message = {
    notification: {
      title: "🎉 New Order Received!",
      body: `Order #${orderId} from ${customerName} for ₹${amount}`
    },
    data: {
      orderId: String(orderId),
      catalogueId: catalogueId || "",
      type: "order",
      storeHandle: storeHandle || ""
    },
    topic: topicName
  };

  try {
    await messaging.send(message);
    console.log(`🔔 Notification sent: New Order ${orderId} to topic ${topicName}`);
  } catch (error) {
    console.error("❌ FCM Error (Order):", error.message);
  }
}

/**
 * Sends a push notification to the 'admin_new_users_[storeHandle]' topic
 */
async function notifyNewUser(userName, userEmail, storeHandle) {
  if (!serviceAccount) return;

  const topicName = storeHandle ? `admin_new_users_${storeHandle}` : "admin_new_users";

  const message = {
    notification: {
      title: "👤 New User Registered",
      body: `${userName} just joined.`
    },
    data: {
      email: userEmail,
      type: "user",
      storeHandle: storeHandle || ""
    },
    topic: topicName
  };

  try {
    await messaging.send(message);
    console.log(`🔔 Notification sent: New User ${userEmail} to topic ${topicName}`);
  } catch (error) {
    console.error("❌ FCM Error (User):", error.message);
  }
}

/**
 * Sends a push notification to the 'admin_product_requests_[storeHandle]' topic
 */
async function notifyNewProductRequest(productName, buyerName, storeHandle) {
  if (!serviceAccount) return;

  const topicName = storeHandle ? `admin_product_requests_${storeHandle}` : "admin_product_requests";

  const message = {
    notification: {
      title: "📦 New Product Request!",
      body: `${buyerName} requested: ${productName}`
    },
    data: {
      productName: productName || "",
      buyerName: buyerName || "",
      type: "product_request",
      storeHandle: storeHandle || ""
    },
    topic: topicName
  };

  try {
    await messaging.send(message);
    console.log(`🔔 Notification sent: Product Request "${productName}" to topic ${topicName}`);
  } catch (error) {
    console.error("❌ FCM Error (Product Request):", error.message);
  }
}

module.exports = { notifyNewOrder, notifyNewUser, notifyNewProductRequest };