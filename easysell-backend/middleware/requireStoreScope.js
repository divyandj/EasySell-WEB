const { buildError } = require('../constants/paymentErrors');

function normalizeStoreHandle(value) {
  return String(value || '').trim().toLowerCase();
}

function requireStoreScope(req, _res, next) {
  const profileStoreHandle = normalizeStoreHandle(req.auth?.profile?.storeHandle);
  if (!profileStoreHandle) {
    return next(buildError('STORE_SCOPE_REQUIRED'));
  }

  req.storeHandleScope = profileStoreHandle;
  return next();
}

module.exports = requireStoreScope;
