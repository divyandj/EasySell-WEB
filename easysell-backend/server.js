
const express = require("express");
const cors = require("cors");

// --- NEW: Import Notification Service safely ---
// We use try-catch so your server doesn't crash if the notification setup isn't done yet.
let notificationService;
try {
  notificationService = require("./utils/notificationService");
} catch (error) {
  console.warn("⚠️ Notification Service not loaded. (Check if utils/notificationService.js and serviceAccountKey.json exist)");
}

let analyticsService;
try {
  analyticsService = require("./utils/analyticsService");
} catch (error) {
  console.warn("⚠️ Analytics Service not loaded. (Check if utils/analyticsService.js exists)");
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// --- NEW: Add JSON Middleware ---
// This is required for the Notification API to read data sent from your React App.
app.use(express.json());


app.get("/", (req, res) => {
  res.send("EasySell Backend (Notifications) is running!");
});


// ==========================================
//  NOTIFICATION API ENDPOINTS
// ==========================================

// 1. Endpoint for New Orders
app.post("/api/notify-order", (req, res) => {
  if (!notificationService) {
    return res.status(500).json({ error: "Notification service not configured properly." });
  }

  const { orderId, catalogueId, amount, customerName, storeHandle } = req.body;

  // Call the service (fire and forget - we don't wait for it to finish)
  notificationService.notifyNewOrder(orderId, catalogueId, amount, customerName, storeHandle);

  return res.json({ success: true, message: "Order notification queued" });
});

// 2. Endpoint for New Users
app.post("/api/notify-signup", (req, res) => {
  if (!notificationService) {
    return res.status(500).json({ error: "Notification service not configured properly." });
  }

  const { userName, userEmail, storeHandle } = req.body;

  // Call the service
  notificationService.notifyNewUser(userName, userEmail, storeHandle);

  return res.json({ success: true, message: "User notification queued" });
});

// ==========================================
//  ANALYTICS API ENDPOINTS
// ==========================================

// 1. Visit Tracking
app.post("/api/analytics/visit", async (req, res) => {
  if (!analyticsService) return res.status(500).json({ error: "Service unavailable" });
  const { storeHandle } = req.body;
  if (!storeHandle) return res.status(400).json({ error: "storeHandle required" });

  await analyticsService.trackVisit(storeHandle);
  return res.json({ success: true });
});

// 2. Order Tracking (GMV, Products, Buyers)
app.post("/api/analytics/order", async (req, res) => {
  if (!analyticsService) return res.status(500).json({ error: "Service unavailable" });
  const { storeHandle, orderData } = req.body;
  if (!storeHandle || !orderData) return res.status(400).json({ error: "storeHandle and orderData required" });

  await analyticsService.trackOrder(storeHandle, orderData);
  return res.json({ success: true });
});

// 3. Abandoned Cart Tracking
app.post("/api/analytics/abandoned", async (req, res) => {
  if (!analyticsService) return res.status(500).json({ error: "Service unavailable" });
  const { storeHandle, cartValue } = req.body;
  if (!storeHandle || !cartValue) return res.status(400).json({ error: "Required params missing" });

  await analyticsService.trackAbandonedCart(storeHandle, cartValue);
  return res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Server started. Listening on port ${PORT}`);
});