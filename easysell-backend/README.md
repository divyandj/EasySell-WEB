# EasySell Web Backend

## Start Backend

```bash
npm start
```

Server default URL:
- http://127.0.0.1:3001

### Local credential quick setup (PowerShell)

If you do not want to create `serviceAccountKey.json`, export credentials for the current shell session:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT = Get-Content easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json -Raw
npm start
```

Accepted credential sources at startup:
- `FIREBASE_SERVICE_ACCOUNT` env var (JSON string)
- `serviceAccountKey.json` in this folder
- `easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json` in this folder

## Admin Android Integration Contract

- See `ADMIN_PAYMENT_API_CONTRACT.md` for endpoint payloads, response examples, error codes, and cursor pagination usage for the Android admin app.

## Payment Smoke Test

A reusable end-to-end smoke command is available for the B2B payment flow.

### Command

```bash
npm run smoke:payment
```

### What it verifies

- Collection account creation and activation
- Buyer order creation and status fetch
- UTR submit flow
- One-time UTR correction rule (`UTR_CORRECTION_ALREADY_USED` on second correction)
- Admin reconcile/dispute/reopen transitions
- Pending/review/history listing endpoints with cursor parameters
- Buyer pending cancellation flow
- Reopen requirement guard (`REOPEN_REQUIRED` path via invalid reconcile on disputed)
- One ACTIVE account uniqueness per vendor UPI (`VENDOR_ACTIVE_BUCKET_EXISTS`)
- Multi-account behavior (activate/pause transitions, fallback allocation, capacity conflict)
- Cross-store isolation on admin account routes

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

## Collection Accounts Migration Script

Use this helper to remove legacy `debtLedgerId` references and optionally backup/delete old `debtLedger` docs.

Commands:

```bash
npm run migrate:collection-accounts:dry
npm run migrate:collection-accounts:apply
npm run migrate:collection-accounts:delete-ledgers
```

Behavior:
- Dry run reports impacted docs only.
- Apply mode removes `debtLedgerId` field from `orders` and `buckets`.
- Delete mode exports `debtLedger` backup JSON to `scripts/exports/` and deletes docs.

## Troubleshooting

### Error: Firebase Admin credentials not configured

This means the backend could not find valid Firebase Admin JSON from any accepted source.

Checklist:
1. Ensure `FIREBASE_SERVICE_ACCOUNT` is set in the same shell where you run `npm start`.
2. If using local file fallback, verify either `serviceAccountKey.json` or `easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json` exists in this folder.
3. Ensure the JSON is valid and not truncated.
4. Restart the backend process after fixing credentials.
