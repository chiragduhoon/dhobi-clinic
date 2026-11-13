const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/roleGuard');
const ctrl = require('./orders.controller');

// Student
router.post('/', authenticate, requireRole('student'), ctrl.createOrder);
router.get('/mine', authenticate, requireRole('student'), ctrl.myOrders);
router.get('/laundry-history', authenticate, requireRole('student'), ctrl.laundryHistory);

// Worker
router.get('/staff/workload', authenticate, requireRole('worker'), ctrl.staffWorkload);
router.get('/staff/history', authenticate, requireRole('worker'), ctrl.staffHistory);
router.post('/:id/complete-stage', authenticate, requireRole('worker'), ctrl.completeStage);
router.post('/:id/deliver', authenticate, requireRole('worker'), ctrl.deliver);

// Shared (student owner / worker / admin)
router.get('/:id', authenticate, ctrl.orderDetail);

module.exports = router;
