const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/roleGuard');
const ctrl = require('./bags.controller');

// Static routes first (so :id doesn't capture 'mine' / 'scan' / 'bulk')
router.get('/mine', authenticate, requireRole('student'), ctrl.myBag);
router.get('/scan/:qrToken', authenticate, requireRole('worker', 'admin'), ctrl.scan);
router.post('/bulk', authenticate, requireRole('admin'), ctrl.createBulk);

router.get('/', authenticate, requireRole('admin'), ctrl.listBags);
router.post('/', authenticate, requireRole('admin'), ctrl.createBag);
router.get('/:id', authenticate, requireRole('admin'), ctrl.getBag);
router.patch('/:id/assign', authenticate, requireRole('admin'), ctrl.assignBag);
router.patch('/:id/unassign', authenticate, requireRole('admin'), ctrl.unassignBag);

module.exports = router;
