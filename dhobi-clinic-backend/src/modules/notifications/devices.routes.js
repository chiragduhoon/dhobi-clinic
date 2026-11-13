const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const ctrl = require('./notifications.controller');

router.post('/token', authenticate, ctrl.saveToken);
router.delete('/token', authenticate, ctrl.removeToken);

module.exports = router;
