# EasySell Web Backend

## Admin Android Integration Contract

- See `ADMIN_PAYMENT_API_CONTRACT.md` for endpoint payloads, response examples, error codes, and cursor pagination usage for the Android admin app.

## Payment Smoke Test

A reusable end-to-end smoke command is available for the B2B payment flow.

### Command

```bash
npm run smoke:payment
```

### What it verifies

- Debt ledger creation
- Bucket creation and activation
- Buyer order creation and status fetch
- UTR submit flow
- One-time UTR correction rule (`UTR_CORRECTION_ALREADY_USED` on second correction)
- Admin reconcile/dispute/reopen transitions
- Pending/review/history listing endpoints with cursor parameters
- Buyer pending cancellation flow
- Reopen requirement guard (`REOPEN_REQUIRED` path via invalid reconcile on disputed)
- One ACTIVE bucket uniqueness per vendor UPI (`VENDOR_ACTIVE_BUCKET_EXISTS`)
- Debt-ledger overpaid protection (`LEDGER_OVERPAID_BLOCK` on new bucket creation)

### Prerequisites

- Backend server running (default base URL: `http://127.0.0.1:3001`)
- Firebase Admin credentials configured using either:
- `FIREBASE_SERVICE_ACCOUNT` environment variable (JSON string), or
- Local key file in this folder:
  - `serviceAccountKey.json`, or
  - `easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json`
- `app/google-services.json` present in the workspace (used for Firebase Auth API key in smoke flow)

### Optional environment variable

- `SMOKE_BASE_URL` to target a non-default API host

```bash
SMOKE_BASE_URL=http://localhost:4000 npm run smoke:payment
```
