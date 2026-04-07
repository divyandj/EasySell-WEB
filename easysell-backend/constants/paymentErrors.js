const ERROR_DEFS = {
  INVALID_INPUT: { httpStatus: 400, code: 'INVALID_INPUT', message: 'Invalid request input.' },
  UNAUTHORIZED: { httpStatus: 401, code: 'UNAUTHORIZED', message: 'Authentication required.' },
  FORBIDDEN: { httpStatus: 403, code: 'FORBIDDEN', message: 'You are not allowed to perform this action.' },
  STORE_SCOPE_REQUIRED: { httpStatus: 403, code: 'STORE_SCOPE_REQUIRED', message: 'Store context is required for this operation.' },
  STORE_SCOPE_MISMATCH: { httpStatus: 403, code: 'STORE_SCOPE_MISMATCH', message: 'Resource does not belong to your store scope.' },
  ORDER_NOT_FOUND: { httpStatus: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' },
  BUCKET_NOT_FOUND: { httpStatus: 404, code: 'BUCKET_NOT_FOUND', message: 'Bucket not found.' },
  LEDGER_NOT_FOUND: { httpStatus: 404, code: 'LEDGER_NOT_FOUND', message: 'Debt ledger not found.' },

  NO_BUCKET_AVAILABLE: { httpStatus: 409, code: 'NO_BUCKET_AVAILABLE', message: 'No active bucket can absorb this order.' },
  ORDER_TOO_LARGE_FOR_BUCKETS: { httpStatus: 409, code: 'ORDER_TOO_LARGE_FOR_BUCKETS', message: 'Order amount is too large for available buckets.' },
  BUCKET_CAPACITY_CHANGED: { httpStatus: 409, code: 'BUCKET_CAPACITY_CHANGED', message: 'Bucket capacity changed during allocation. Please retry.' },
  SUFFIX_POOL_EXHAUSTED: { httpStatus: 409, code: 'SUFFIX_POOL_EXHAUSTED', message: 'All unique suffixes are currently in use for this bucket.' },
  SUFFIX_COLLISION_RETRY_FAILED: { httpStatus: 409, code: 'SUFFIX_COLLISION_RETRY_FAILED', message: 'Could not reserve unique suffix after retries.' },
  DUPLICATE_UTR: { httpStatus: 409, code: 'DUPLICATE_UTR', message: 'UTR already used by another order.' },

  ORDER_EXPIRED: { httpStatus: 409, code: 'ORDER_EXPIRED', message: 'Order has already expired.' },
  ORDER_EXPIRED_LATE_PAYMENT: { httpStatus: 409, code: 'ORDER_EXPIRED_LATE_PAYMENT', message: 'Order expired before UTR submission.' },
  ORDER_STATUS_INVALID_FOR_UTR: { httpStatus: 409, code: 'ORDER_STATUS_INVALID_FOR_UTR', message: 'Order status does not allow UTR submission.' },
  ORDER_NOT_CONFIRMABLE: { httpStatus: 409, code: 'ORDER_NOT_CONFIRMABLE', message: 'Order cannot be confirmed in current state.' },
  REOPEN_REQUIRED: { httpStatus: 409, code: 'REOPEN_REQUIRED', message: 'Disputed order must be reopened before confirmation.' },
  UTR_CORRECTION_ALREADY_USED: { httpStatus: 409, code: 'UTR_CORRECTION_ALREADY_USED', message: 'UTR correction has already been used for this order.' },

  BUCKET_INVARIANT_VIOLATION: { httpStatus: 500, code: 'BUCKET_INVARIANT_VIOLATION', message: 'Bucket accounting invariant failed.' },
  ORDER_CREATE_ATOMICITY_FAILED: { httpStatus: 500, code: 'ORDER_CREATE_ATOMICITY_FAILED', message: 'Failed to create order atomically.' },
  TRANSACTION_RETRY_EXHAUSTED: { httpStatus: 503, code: 'TRANSACTION_RETRY_EXHAUSTED', message: 'High contention, please retry.' },
  LEDGER_OVERPAID_BLOCK: { httpStatus: 409, code: 'LEDGER_OVERPAID_BLOCK', message: 'Cannot create bucket: debt ledger is OVERPAID.' },
  VENDOR_ACTIVE_BUCKET_EXISTS: { httpStatus: 409, code: 'VENDOR_ACTIVE_BUCKET_EXISTS', message: 'Vendor already has an active bucket.' },
};

function buildError(key, overrides = {}) {
  const base = ERROR_DEFS[key] || ERROR_DEFS.INVALID_INPUT;
  return {
    ...base,
    ...overrides,
  };
}

function sendError(res, err) {
  const httpStatus = err.httpStatus || 500;
  return res.status(httpStatus).json({
    success: false,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
    details: err.details || null,
  });
}

function success(data = {}, message = 'OK') {
  return {
    success: true,
    message,
    ...data,
  };
}

module.exports = {
  ERROR_DEFS,
  buildError,
  sendError,
  success,
};
