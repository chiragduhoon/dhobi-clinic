const { admin } = require('../config/firebase');
const pool = require('../config/db');

async function sendNotificationToUser(userId, title, body, data = {}) {
  let tokens;
  try {
    const result = await pool.query(
      'SELECT token FROM fcm_tokens WHERE user_id = $1',
      [userId]
    );
    tokens = result.rows.map((r) => r.token);
  } catch (err) {
    console.error('FCM: failed to fetch tokens:', err);
    return;
  }

  if (!tokens.length) return;

  try {
    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });

    const invalidTokens = [];
    response.responses.forEach((res, i) => {
      if (!res.success && res.error?.code === 'messaging/registration-token-not-registered') {
        invalidTokens.push(tokens[i]);
      }
    });

    if (invalidTokens.length) {
      await pool.query('DELETE FROM fcm_tokens WHERE token = ANY($1)', [invalidTokens]);
    }
  } catch (err) {
    console.error('FCM: send failed:', err);
  }
}

module.exports = { sendNotificationToUser };
