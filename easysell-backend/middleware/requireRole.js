const { buildError } = require('../constants/paymentErrors');

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function requireRole(role) {
  const expected = normalize(role);
  return (req, _res, next) => {
    const current = normalize(req.auth?.role || req.auth?.userType);

    if (expected === 'buyer') {
      if (current === 'buyer' || current === 'user') return next();
      return next(buildError('FORBIDDEN'));
    }

    if (expected === 'admin') {
      if (current === 'admin' || current === 'seller') return next();
      return next(buildError('FORBIDDEN'));
    }

    return next(buildError('FORBIDDEN'));
  };
}

module.exports = requireRole;
