const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs"); // Node.js File System module
const path = require("path"); // Node.js Path module
const crypto = require("crypto"); // Node.js Crypto module for hashing

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

// Define the directory where cached images will be stored
const CACHE_DIR = path.join(__dirname, "image_cache");

// Create the cache directory if it doesn't exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
  console.log(`Created cache directory at ${CACHE_DIR}`);
}

app.use(cors());

// --- NEW: Add JSON Middleware ---
// This is required for the Notification API to read data sent from your React App.
app.use(express.json()); 


app.get("/", (req, res) => {
  res.send("Image Proxy Server & Notification Relay is running!");
});


// ==========================================
//  NEW: NOTIFICATION API ENDPOINTS
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


// ==========================================
//  EXISTING: IMAGE PROXY LOGIC
// ==========================================

app.get("/proxy", async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl || !imageUrl.startsWith("https://drive.google.com/")) {
    return res
      .status(400)
      .send("Bad Request: A valid Google Drive URL must be provided.");
  }

  try {
    // Create a unique, safe filename for the cached image by hashing the URL
    const hash = crypto.createHash("md5").update(imageUrl).digest("hex");
    const fileExtension = path.extname(new URL(imageUrl).pathname) || ".jpg"; // Basic extension detection
    const cachedImagePath = path.join(CACHE_DIR, `${hash}${fileExtension}`);

    // CHECK 1: Does the cached file already exist?
    if (fs.existsSync(cachedImagePath)) {
      console.log(`CACHE HIT: Serving image from cache for ${imageUrl}`);
      // If yes, serve it directly from the filesystem
      return res.sendFile(cachedImagePath);
    }

    // CHECK 2: If not in cache, fetch from Google Drive
    console.log(`CACHE MISS: Fetching image from Google Drive for ${imageUrl}`);
    const response = await axios({
      method: "get",
      url: imageUrl,
      responseType: "stream",
    });

    // Pipe the stream from Google Drive into a local file AND to the user's response
    const writer = fs.createWriteStream(cachedImagePath);
    response.data.pipe(writer); // Save to cache
    response.data.pipe(res); // Send to user

    writer.on("finish", () => {
      console.log(`SUCCESS: Cached image at ${cachedImagePath}`);
    });

    writer.on("error", (err) => {
      console.error("Error writing to cache:", err);
      // If caching fails, delete the potentially corrupt file
      fs.unlink(cachedImagePath, () => {});
    });
  } catch (error) {
    console.error(`Error fetching image: ${error.message}`);
    res.status(502).send("Bad Gateway: Failed to fetch the image.");
  }
});

app.listen(PORT, () => {
  // console.log(`✅ Caching backend server started and listening on http://localhost:${PORT}`);
  console.log(`✅ Server started. Listening on port ${PORT}`);
});