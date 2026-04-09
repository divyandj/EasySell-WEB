const { getMessaging } = require('./firebaseAdmin');

let messaging = null;
try {
  messaging = getMessaging();
} catch (error) {
  console.error('⚠️ WARNING: Firebase Credentials not found (set FIREBASE_SERVICE_ACCOUNT or local service account JSON).');
}

// --- Helper Functions ---

/**
 * Sends a push notification to the 'admin_orders_[storeHandle]' topic
 */
async function notifyNewOrder(orderId, catalogueId, amount, customerName, storeHandle) {
  if (!messaging) return;

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
  if (!messaging) return;

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
  if (!messaging) return;

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