const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const ctrl = require('./auth.controller');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.getMe);
router.patch('/me/notification-prefs', authenticate, ctrl.updateNotificationPrefs);

module.exports = router;
