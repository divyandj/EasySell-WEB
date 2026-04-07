# Admin Android Collection Accounts API Contract

This document defines the API contract for Android admin integration with the payment flow using Collection Accounts (no debt-ledger subsystem).

Base URL:
- Production: https://easysell-backend-aweq.onrender.com
- Local: http://127.0.0.1:3001

Auth:
- Header: Authorization: Bearer <Firebase ID token>
- Admin role required for all /api/admin/payment/* routes.
- Strict store scope is enforced server-side.

Common response envelope:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Common error envelope:

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": null
}
```

## 1) Confirm Order

Route:
- POST /api/admin/payment/orders/:orderId/confirm

Body:

```json
{
  "action": "RECONCILE"
}
```

action allowed values:
- RECONCILE
- DISPUTE

Success (200):

```json
{
  "success": true,
  "message": "Order confirmation updated",
  "data": {
    "orderId": "0ZcRrngzFo4jt0DRimhU",
    "paymentStatus": "RECONCILED",
    "bucketStatus": "ACTIVE",
    "storeHandle": "my-store"
  }
}
```

Possible errors:
- ORDER_NOT_FOUND (404)
- ORDER_EXPIRED (409)
- ORDER_NOT_CONFIRMABLE (409)
- REOPEN_REQUIRED (409)
- BUCKET_NOT_FOUND (404)
- STORE_SCOPE_REQUIRED (403)
- STORE_SCOPE_MISMATCH (403)
- INVALID_INPUT (400)

## 2) Reopen Disputed Order

Route:
- POST /api/admin/payment/orders/:orderId/reopen

Body:
- Empty JSON {}

Success (200):

```json
{
  "success": true,
  "message": "Order moved to review",
  "data": {
    "orderId": "R2yHgbmV3cnaCPlb7a0b",
    "paymentStatus": "PAYMENT_UNDER_REVIEW"
  }
}
```

Possible errors:
- ORDER_NOT_FOUND (404)
- STORE_SCOPE_REQUIRED (403)
- STORE_SCOPE_MISMATCH (403)
- INVALID_INPUT (400)

## 3) Pending Queue

Route:
- GET /api/admin/payment/orders/pending?limit=<n>&cursor=<millis>

Returns orders in:
- UTR_SUBMITTED

Success (200):

```json
{
  "success": true,
  "message": "Pending orders fetched",
  "data": {
    "items": [
      {
        "orderId": "0ZcRrngzFo4jt0DRimhU",
        "orderAmount": 1234,
        "uniquePayableAmount": 1234.01,
        "utrNumber": "775412526152",
        "paymentStatus": "UTR_SUBMITTED",
        "createdAt": 1775412541602,
        "cancelledAt": null
      }
    ],
    "nextCursor": null
  }
}
```

## 4) Under Review Queue

Route:
- GET /api/admin/payment/orders/review?limit=<n>&cursor=<millis>

Returns orders in:
- PAYMENT_UNDER_REVIEW

Success schema is same as pending.

## 5) History Queue

Route:
- GET /api/admin/payment/orders/history?limit=<n>&cursor=<millis>

Returns non-action statuses:
- RECONCILED
- DISPUTED
- CANCELLED_BY_BUYER
- EXPIRED

Success schema is same list envelope (items, nextCursor).

## 6) List Collection Accounts

Route:
- GET /api/admin/payment/buckets

Success (200):

```json
{
  "success": true,
  "message": "Buckets fetched",
  "data": [
    {
      "bucketId": "KwuXoMGceV6oJ2VM3yrZ",
      "vendorName": "Smoke Vendor",
      "vendorUpiId": "smoke1775412526152@upi",
      "status": "ACTIVE",
      "priority": 1,
      "limitAmount": 10000,
      "reservedAmount": 0,
      "collectedAmount": 1234,
      "availableAmount": 8766,
      "storeHandle": "my-store"
    }
  ]
}
```

## 7) Create Collection Account

Route:
- POST /api/admin/payment/buckets

Body:

```json
{
  "vendorName": "Vendor A",
  "vendorUpiId": "vendor-a@upi",
  "qrImageUrl": "https://...",
  "qrType": "UPI",
  "priority": 1,
  "limitAmount": 100000
}
```

Success (200): returns created account with bucketId.

Possible errors:
- INVALID_INPUT (400)
- STORE_SCOPE_REQUIRED (403)

## 8) Update Collection Account Status

Route:
- PATCH /api/admin/payment/buckets/:bucketId/status

Body:

```json
{
  "status": "ACTIVE"
}
```

Allowed target statuses:
- ACTIVE
- PAUSED
- CLOSED

Success (200): returns updated account.

Possible errors:
- BUCKET_NOT_FOUND (404)
- INVALID_INPUT (400)
- STORE_SCOPE_REQUIRED (403)
- STORE_SCOPE_MISMATCH (403)
- VENDOR_ACTIVE_BUCKET_EXISTS (409)

## Cursor Pagination Rules

For list endpoints (pending, review, history):
- Query params:
  - limit: optional, default 20, max 100
  - cursor: optional epoch millis from previous nextCursor
- Response:
  - nextCursor: null means no further page
- Android usage:
  1. Request first page without cursor
  2. Append data.items to list
  3. If data.nextCursor is not null, request next page with cursor=data.nextCursor
  4. Stop when nextCursor is null

## Android Queue Mapping

Action tabs:
- Pending Payments: GET /orders/pending
- Under Review: GET /orders/review

History tab:
- RECONCILED
- DISPUTED
- CANCELLED_BY_BUYER
- EXPIRED

Do not include cancelled or disputed orders in action tabs.

## Error Code Mapping Suggestions

Suggested Android message mapping:
- UTR_CORRECTION_ALREADY_USED: UTR can only be corrected once.
- REOPEN_REQUIRED: Reopen disputed order before confirming.
- ORDER_NOT_CONFIRMABLE: Order is not in confirmable state.
- ORDER_EXPIRED: Order has expired.
- VENDOR_ACTIVE_BUCKET_EXISTS: This payment handle already has an active collection account.
- STORE_SCOPE_MISMATCH: You can only manage accounts and orders for your own store.

## Smoke Verification Command

To verify backend contract after changes:

```bash
npm run smoke:payment
```

From:
- EasySell-WEB/easysell-backend
