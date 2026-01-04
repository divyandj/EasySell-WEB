
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

  const { orderId, amount, customerName } = req.body;
  
  // Call the service (fire and forget - we don't wait for it to finish)
  notificationService.notifyNewOrder(orderId, amount, customerName);
  
  return res.json({ success: true, message: "Order notification queued" });
});

// 2. Endpoint for New Users
app.post("/api/notify-signup", (req, res) => {
  if (!notificationService) {
    return res.status(500).json({ error: "Notification service not configured properly." });
  }

  const { userName, userEmail } = req.body;

  // Call the service
  notificationService.notifyNewUser(userName, userEmail);

  return res.json({ success: true, message: "User notification queued" });
});

app.listen(PORT, () => {
  console.log(`✅ Server started. Listening on port ${PORT}`);
});