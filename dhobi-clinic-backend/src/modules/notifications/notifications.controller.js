const svc = require('./notifications.service');

async function list(req, res, next) {
  try { res.json(await svc.listNotifications(req.user.id, Number(req.query.page) || 1)); }
  catch (err) { next(err); }
}
async function markRead(req, res, next) {
  try { await svc.markRead(req.params.id, req.user.id); res.json({ ok: true }); }
  catch (err) { next(err); }
}
async function markAllRead(req, res, next) {
  try { await svc.markAllRead(req.user.id); res.json({ ok: true }); }
  catch (err) { next(err); }
}
async function saveToken(req, res, next) {
  try {
    if (!req.body.token) return res.status(400).json({ error: 'token is required' });
    await svc.saveToken(req.user.id, req.body.token, req.body.device);
    res.json({ ok: true });
  } catch (err) { next(err); }
}
async function removeToken(req, res, next) {
  try {
    if (!req.body.token) return res.status(400).json({ error: 'token is required' });
    await svc.removeToken(req.user.id, req.body.token);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { list, markRead, markAllRead, saveToken, removeToken };
