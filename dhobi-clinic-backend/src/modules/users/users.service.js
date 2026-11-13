const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../../config/db');

async function listUsers(role) {
  const conditions = role ? 'WHERE role = $1' : '';
  const params = role ? [role] : [];
  const result = await pool.query(
    `SELECT id, name, email, role, enrollment_no, room_number, is_active, created_at
     FROM users ${conditions} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
}

async function createUser({ name, email, password, role, enrollment_no, room_number }) {
  if (!name || !email || !password || !role) {
    throw Object.assign(new Error('name, email, password, role are required'), { status: 400 });
  }
  const hash = await bcrypt.hash(password, 10);
  // Students get a permanent QR code printed on their bag; staff/admin do not
  const qrCode = role === 'student' ? uuidv4().replace(/-/g, '') : null;
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, enrollment_no, room_number, qr_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, role, enrollment_no, room_number, qr_code, created_at`,
    [name, email, hash, role, enrollment_no || null, room_number || null, qrCode]
  );
  return result.rows[0];
}

async function updateUser(id, updates) {
  const allowed = ['name', 'room_number', 'is_active'];
  const fields = Object.keys(updates).filter((k) => allowed.includes(k));
  if (!fields.length) throw Object.assign(new Error('No valid fields to update'), { status: 400 });

  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map((f) => updates[f]);

  const result = await pool.query(
    `UPDATE users SET ${sets}, updated_at = NOW() WHERE id = $1
     RETURNING id, name, email, role, enrollment_no, room_number, is_active`,
    [id, ...values]
  );
  if (!result.rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
  return result.rows[0];
}

async function deactivateUser(id) {
  const result = await pool.query(
    'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
  return { ok: true };
}

module.exports = { listUsers, createUser, updateUser, deactivateUser };
