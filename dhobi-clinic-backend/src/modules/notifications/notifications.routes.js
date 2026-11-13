const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const ctrl = require('./notifications.controller');

router.get('/', authenticate, ctrl.list);
router.patch('/read-all', authenticate, ctrl.markAllRead);
router.patch('/:id/read', authenticate, ctrl.markRead);

module.exports = router;
