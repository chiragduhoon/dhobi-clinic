const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/roleGuard');
const ctrl = require('./admin.controller');

router.use(authenticate, requireRole('admin'));

// Users / workers
router.get('/users', ctrl.listUsers);
router.post('/users', ctrl.createUser);
router.patch('/users/:id', ctrl.updateUser);
router.delete('/users/:id', ctrl.deactivateUser);

// Orders + exceptions + rework
router.get('/orders', ctrl.listOrders);
router.post('/orders/:id/exception', ctrl.setException);
router.post('/orders/:id/clear-exception', ctrl.clearException);
router.post('/orders/:id/rework', ctrl.rework);

// Audit + analytics
router.get('/bags/:id/audit', ctrl.bagAudit);
router.get('/stats', ctrl.getStats);
router.get('/productivity', ctrl.getProductivity);
router.get('/live-board', ctrl.liveBoard);

// Reports (CSV)
router.get('/reports/orders.csv', ctrl.ordersReportCsv);
router.get('/reports/productivity.csv', ctrl.productivityReportCsv);

module.exports = router;
