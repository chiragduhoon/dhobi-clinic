const pool = require('../../config/db');
const { sendNotificationToUser } = require('../../utils/fcm');

// Create an in-app notification (+ FCM push) for a push-worthy category,
// respecting the user's notification_prefs. Categories: accepted, ready_for_collection,
// delivered, exception. Other stage updates are timeline-only (no notification row).
async function createNotification(userId, category, title, body, { orderId = null, bagId = null } = {}) {
  const prefRow = await pool.query('SELECT notification_prefs FROM users WHERE id = $1', [userId]);
  const prefs = prefRow.rows[0]?.notification_prefs || {};
  if (prefs[category] === false) return; // user opted out of this category

  await pool.query(
    `INSERT INTO notifications (user_id, order_id, bag_id, category, title, body)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, orderId, bagId, category, title, body]
  );
  await sendNotificationToUser(userId, title, body, { order_id: orderId || '', category });
}

async function listNotifications(userId, page = 1, limit = 30) {
  const offset = (page - 1) * limit;
  const r = await pool.query(
    `SELECT id, order_id, bag_id, category, title, body, is_read, sent_at
     FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return r.rows;
}

async function markRead(id, userId) {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, userId]);
}

async function markAllRead(userId) {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
}

async function saveToken(userId, token, device) {
  await pool.query(
    `INSERT INTO fcm_tokens (user_id, token, device) VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET user_id = $1, device = $3`,
    [userId, token, device || null]
  );
}

async function removeToken(userId, token) {
  await pool.query('DELETE FROM fcm_tokens WHERE token = $1 AND user_id = $2', [token, userId]);
}

module.exports = { createNotification, listNotifications, markRead, markAllRead, saveToken, removeToken };
