const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
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
  createBucketWithLedgerGuard,
  updateBucketStatus,
} = require('../services/bucketAllocatorService');
const { listLedgers, createLedger } = require('../services/debtLedgerService');

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

router.post('/orders/:orderId/confirm', auth, requireRole('admin'), withHandler(async (req, res) => {
  const action = String(req.body?.action || '').trim();
  const data = await confirmOrder(req.params.orderId, action, req.auth.uid);
  res.json(success({ data }, 'Order confirmation updated'));
}));

router.post('/orders/:orderId/reopen', auth, requireRole('admin'), withHandler(async (req, res) => {
  const data = await reopenDisputedOrder(req.params.orderId, req.auth.uid);
  res.json(success({ data }, 'Order moved to review'));
}));

router.get('/orders/pending', auth, requireRole('admin'), withHandler(async (req, res) => {
  const data = await listPendingUtrOrders(req.query);
  res.json(success({ data }, 'Pending orders fetched'));
}));

router.get('/orders/review', auth, requireRole('admin'), withHandler(async (req, res) => {
  const data = await listReviewOrders(req.query);
  res.json(success({ data }, 'Review orders fetched'));
}));

router.get('/orders/history', auth, requireRole('admin'), withHandler(async (req, res) => {
  const data = await listHistoryOrders(req.query);
  res.json(success({ data }, 'History orders fetched'));
}));

router.get('/buckets', auth, requireRole('admin'), withHandler(async (_req, res) => {
  const data = await listBucketsWithComputedAvailable();
  res.json(success({ data }, 'Buckets fetched'));
}));

router.post('/buckets', auth, requireRole('admin'), withHandler(async (req, res) => {
  const data = await createBucketWithLedgerGuard(req.body || {});
  res.json(success({ data }, 'Bucket created'));
}));

router.patch('/buckets/:bucketId/status', auth, requireRole('admin'), withHandler(async (req, res) => {
  const data = await updateBucketStatus(req.params.bucketId, req.body?.status);
  res.json(success({ data }, 'Bucket status updated'));
}));

router.get('/debt-ledger', auth, requireRole('admin'), withHandler(async (_req, res) => {
  const data = await listLedgers();
  res.json(success({ data }, 'Debt ledgers fetched'));
}));

router.post('/debt-ledger', auth, requireRole('admin'), withHandler(async (req, res) => {
  const data = await createLedger(req.body || {});
  res.json(success({ data }, 'Debt ledger created'));
}));

module.exports = router;
