const pool = require('../../config/db');

async function saveToken(req, res, next) {
  try {
    const { token, device } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });
    await pool.query(
      `INSERT INTO fcm_tokens (user_id, token, device)
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET user_id = $1, device = $3`,
      [req.user.id, token, device || null]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function removeToken(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });
    await pool.query('DELETE FROM fcm_tokens WHERE token = $1 AND user_id = $2', [token, req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { saveToken, removeToken };
