const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { buildError, success } = require('../constants/paymentErrors');
const { createOrder, getOrderStatus } = require('../services/orderPaymentService');
const { submitUtr, correctUtrOnce } = require('../services/utrService');
const { cancelPendingOrder } = require('../services/buyerCancelService');

const router = express.Router();

function withHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error.httpStatus ? error : buildError('INVALID_INPUT', { message: error.message }));
    }
  };
}

function getStoreHandle(req) {
  const fromBody = req.body?.storeHandle;
  const fromQuery = req.query?.storeHandle;
  const fromHeader = req.headers['x-store-handle'];
  return String(fromBody || fromQuery || fromHeader || '').trim().toLowerCase();
}

router.post('/orders', auth, requireRole('buyer'), withHandler(async (req, res) => {
  const buyerId = String(req.body?.buyerId || '').trim();
  const orderAmount = Number(req.body?.orderAmount || 0);
  const storeHandle = getStoreHandle(req);

  if (!buyerId || orderAmount <= 0) {
    throw buildError('INVALID_INPUT', { message: 'buyerId and positive orderAmount are required.' });
  }
  if (buyerId !== req.auth.uid) {
    throw buildError('FORBIDDEN');
  }

  const data = await createOrder({ buyerId, orderAmount, storeHandle });
  res.json(success({ data }, 'Order created'));
}));

router.get('/orders/:orderId/status', auth, requireRole('buyer'), withHandler(async (req, res) => {
  const data = await getOrderStatus(req.params.orderId, req.auth.uid);
  res.json(success({ data }, 'Order status fetched'));
}));

router.post('/orders/:orderId/submit-utr', auth, requireRole('buyer'), withHandler(async (req, res) => {
  const utrNumber = String(req.body?.utrNumber || '').trim();
  const paymentProofUrl = req.body?.paymentProofUrl || null;
  const data = await submitUtr(req.params.orderId, req.auth.uid, utrNumber, paymentProofUrl);
  res.json(success({ data }, 'UTR submitted'));
}));

router.post('/orders/:orderId/correct-utr', auth, requireRole('buyer'), withHandler(async (req, res) => {
  const newUtrNumber = String(req.body?.utrNumber || '').trim();
  const data = await correctUtrOnce(req.params.orderId, req.auth.uid, newUtrNumber);
  res.json(success({ data }, 'UTR corrected'));
}));

router.post('/orders/:orderId/cancel', auth, requireRole('buyer'), withHandler(async (req, res) => {
  const data = await cancelPendingOrder(req.params.orderId, req.auth.uid);
  res.json(success({ data }, 'Order cancelled'));
}));

module.exports = router;
