const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/roleGuard');
const ctrl = require('./users.controller');

router.get('/admin/users', authenticate, requireRole('admin'), ctrl.listUsers);
router.post('/admin/users', authenticate, requireRole('admin'), ctrl.createUser);
router.patch('/admin/users/:id', authenticate, requireRole('admin'), ctrl.updateUser);
router.delete('/admin/users/:id', authenticate, requireRole('admin'), ctrl.deactivateUser);

module.exports = router;
