const authService = require('./auth.service');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    res.json(await authService.login(email, password));
  } catch (err) { next(err); }
}

async function register(req, res, next) {
  try {
    res.status(201).json(await authService.register(req.body));
  } catch (err) { next(err); }
}

async function getMe(req, res, next) {
  try {
    res.json(await authService.getMe(req.user.id));
  } catch (err) { next(err); }
}

async function updateNotificationPrefs(req, res, next) {
  try {
    const prefs = await authService.updateNotificationPrefs(req.user.id, req.body || {});
    res.json({ notification_prefs: prefs });
  } catch (err) { next(err); }
}

module.exports = { login, register, getMe, updateNotificationPrefs };
