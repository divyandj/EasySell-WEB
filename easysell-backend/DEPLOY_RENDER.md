# Deploying EasySell Backend to Render

1.  **Sign up/Log in** to [Render.com](https://render.com/).
2.  Click **New +** -> **Web Service**.
3.  **Connect GitHub**:
    *   Select the repository: `divyandj/EasySell-Backend`.
4.  **Configure Service**:
    *   **Name**: `easysell-backend` (or similar)
    *   **Region**: Singapore (or nearest to users)
    *   **Branch**: `main`
    *   **Root Directory**: `.` (leave empty or dot)
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
5.  **Environment Variables** (Advanced Settings):
    *   Key: `FIREBASE_SERVICE_ACCOUNT`
    *   Value: *[Paste the entire content of your `serviceAccountKey.json` file here as a single line]*
        *   *Tip*: Open your local `serviceAccountKey.json`, copy all text, and paste it.
    *   Key: `PORT`
    *   Value: `3001` (Optional, Render sets this automatically usually, but good to be explicit)
6.  Click **Create Web Service**.

## Verification
Once deployed, Render will give you a URL (e.g., `https://easysell-backend.onrender.com`).
Visit that URL. You should see:
`"EasySell Backend (Notifications) is running!"`
