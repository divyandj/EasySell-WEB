const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const requireStoreScope = require('../middleware/requireStoreScope');
const { buildError, success } = require('../constants/paymentErrors');
const {
  listPendingUtrOrders,
  listReviewOrders,
  listHistoryOrders,
  confirmOrder,
} = require('../services/adminConfirmationService');
const { reopenDisputedOrder } = require('../services/reopenService');
const {
  listBucketsWithComputedAvailable,
  createBucket,
  updateBucketStatus,
} = require('../services/bucketAllocatorService');

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

router.post('/orders/:orderId/confirm', auth, requireRole('admin'), requireStoreScope, withHandler(async (req, res) => {
  const action = String(req.body?.action || '').trim();
  const data = await confirmOrder(req.params.orderId, action, req.auth.uid, req.storeHandleScope);
  res.json(success({ data }, 'Order confirmation updated'));
}));

router.post('/orders/:orderId/reopen', auth, requireRole('admin'), requireStoreScope, withHandler(async (req, res) => {
  const data = await reopenDisputedOrder(req.params.orderId, req.auth.uid, req.storeHandleScope);
  res.json(success({ data }, 'Order moved to review'));
}));

router.get('/orders/pending', auth, requireRole('admin'), requireStoreScope, withHandler(async (req, res) => {
  const data = await listPendingUtrOrders(req.query, req.storeHandleScope);
  res.json(success({ data }, 'Pending orders fetched'));
}));

router.get('/orders/review', auth, requireRole('admin'), requireStoreScope, withHandler(async (req, res) => {
  const data = await listReviewOrders(req.query, req.storeHandleScope);
  res.json(success({ data }, 'Review orders fetched'));
}));

router.get('/orders/history', auth, requireRole('admin'), requireStoreScope, withHandler(async (req, res) => {
  const data = await listHistoryOrders(req.query, req.storeHandleScope);
  res.json(success({ data }, 'History orders fetched'));
}));

router.get('/buckets', auth, requireRole('admin'), requireStoreScope, withHandler(async (req, res) => {
  const data = await listBucketsWithComputedAvailable(req.storeHandleScope);
  res.json(success({ data }, 'Collection accounts fetched'));
}));

router.post('/buckets', auth, requireRole('admin'), requireStoreScope, withHandler(async (req, res) => {
  const data = await createBucket(req.body || {}, req.storeHandleScope);
  res.json(success({ data }, 'Collection account created'));
}));

router.patch('/buckets/:bucketId/status', auth, requireRole('admin'), requireStoreScope, withHandler(async (req, res) => {
  const data = await updateBucketStatus(req.params.bucketId, req.body?.status, req.storeHandleScope);
  res.json(success({ data }, 'Collection account status updated'));
}));

module.exports = router;
