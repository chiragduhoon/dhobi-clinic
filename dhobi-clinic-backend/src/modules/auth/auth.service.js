const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { signToken } = require('../../utils/jwt');

// Build a flat profile object from a users row joined with its profile table
function shapeUser(row) {
  const base = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    is_active: row.is_active,
    notification_prefs: row.notification_prefs,
  };
  if (row.role === 'student') {
    return { ...base, enrollment_no: row.enrollment_no, hostel: row.hostel,
             room_number: row.room_number, phone: row.phone };
  }
  if (row.role === 'worker') {
    return { ...base, staff_code: row.staff_code, specialty_role: row.specialty_role,
             phone: row.phone };
  }
  return base;
}

const PROFILE_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.is_active, u.notification_prefs, u.password_hash,
         st.enrollment_no, st.hostel, st.room_number, st.phone AS student_phone,
         wk.staff_code, wk.specialty_role, wk.phone AS worker_phone
  FROM users u
  LEFT JOIN students st ON st.user_id = u.id
  LEFT JOIN staff    wk ON wk.user_id = u.id
`;

function normalizeProfileRow(row) {
  // unify the two phone columns into one
  return { ...row, phone: row.student_phone ?? row.worker_phone };
}

async function login(email, password) {
  const result = await pool.query(`${PROFILE_SELECT} WHERE u.email = $1 AND u.is_active = TRUE`, [email]);
  const row = result.rows[0];
  if (!row) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const user = shapeUser(normalizeProfileRow(row));
  const token = signToken({ id: user.id, role: user.role, name: user.name });
  return { token, user };
}

async function register({ name, email, password, enrollment_no, hostel, room_number, phone }) {
  if (!name || !email || !password) {
    throw Object.assign(new Error('name, email and password are required'), { status: 400 });
  }
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) throw Object.assign(new Error('An account with this email already exists'), { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const u = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,'student') RETURNING id`,
      [name, email, hash]
    );
    const userId = u.rows[0].id;
    await client.query(
      `INSERT INTO students (user_id, enrollment_no, hostel, room_number, phone)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId, enrollment_no || null, hostel || null, room_number || null, phone || null]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') throw Object.assign(new Error('Enrollment number already registered'), { status: 409 });
    throw err;
  } finally {
    client.release();
  }
  return login(email, password);
}

async function getMe(userId) {
  const result = await pool.query(`${PROFILE_SELECT} WHERE u.id = $1`, [userId]);
  if (!result.rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
  return shapeUser(normalizeProfileRow(result.rows[0]));
}

async function updateNotificationPrefs(userId, prefs) {
  const result = await pool.query(
    `UPDATE users SET notification_prefs = notification_prefs || $2::jsonb, updated_at = NOW()
     WHERE id = $1 RETURNING notification_prefs`,
    [userId, JSON.stringify(prefs)]
  );
  return result.rows[0].notification_prefs;
}

module.exports = { login, register, getMe, updateNotificationPrefs };
