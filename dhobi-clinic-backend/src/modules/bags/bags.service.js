const pool = require('../../config/db');

// DHB-#### from the sequence + opaque qr token, both generated in-DB
const INSERT_BAG = `
  INSERT INTO bags (bag_number, qr_token, student_id)
  VALUES ('DHB-' || lpad(nextval('bag_number_seq')::text, 4, '0'),
          replace(gen_random_uuid()::text, '-', ''),
          $1)
  RETURNING id, bag_number, qr_token, student_id, issue_date, is_active, created_at`;

async function createBag(studentId = null) {
  const result = await pool.query(INSERT_BAG, [studentId]);
  return result.rows[0];
}

async function createBulkBags(count) {
  const n = Math.min(Math.max(parseInt(count) || 0, 1), 2000);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const created = [];
    for (let i = 0; i < n; i++) {
      const r = await client.query(INSERT_BAG, [null]);
      created.push(r.rows[0]);
    }
    await client.query('COMMIT');
    return { count: created.length, bags: created };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listBags({ page = 1, limit = 25, search, assigned } = {}) {
  const offset = (page - 1) * limit;
  const cond = [];
  const params = [];
  let i = 1;
  if (search) {
    cond.push(`(b.bag_number ILIKE $${i} OR u.name ILIKE $${i} OR st.enrollment_no ILIKE $${i})`);
    params.push(`%${search}%`); i++;
  }
  if (assigned === 'true') cond.push('b.student_id IS NOT NULL');
  if (assigned === 'false') cond.push('b.student_id IS NULL');
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';

  const rows = await pool.query(
    `SELECT b.id, b.bag_number, b.qr_token, b.student_id, b.issue_date, b.is_active,
            u.name AS student_name, st.enrollment_no, st.hostel, st.room_number
     FROM bags b
     LEFT JOIN users u ON u.id = b.student_id
     LEFT JOIN students st ON st.user_id = b.student_id
     ${where}
     ORDER BY b.bag_number
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );
  const total = await pool.query(
    `SELECT COUNT(*) FROM bags b
     LEFT JOIN users u ON u.id = b.student_id
     LEFT JOIN students st ON st.user_id = b.student_id ${where}`,
    params
  );
  return { page: Number(page), limit: Number(limit), total: Number(total.rows[0].count), bags: rows.rows };
}

async function getBag(id) {
  const r = await pool.query(
    `SELECT b.*, u.name AS student_name, st.enrollment_no, st.hostel, st.room_number, st.phone
     FROM bags b
     LEFT JOIN users u ON u.id = b.student_id
     LEFT JOIN students st ON st.user_id = b.student_id
     WHERE b.id = $1`,
    [id]
  );
  if (!r.rows[0]) throw Object.assign(new Error('Bag not found'), { status: 404 });
  return r.rows[0];
}

async function assignBag(bagId, studentId) {
  const bag = (await pool.query('SELECT id, student_id FROM bags WHERE id = $1', [bagId])).rows[0];
  if (!bag) throw Object.assign(new Error('Bag not found'), { status: 404 });
  if (bag.student_id && bag.student_id !== studentId) {
    throw Object.assign(new Error('Bag already assigned to another student — unassign first'), { status: 409 });
  }
  const student = (await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'student'", [studentId])).rows[0];
  if (!student) throw Object.assign(new Error('Student not found'), { status: 404 });

  const existing = (await pool.query('SELECT bag_number FROM bags WHERE student_id = $1 AND id <> $2', [studentId, bagId])).rows[0];
  if (existing) throw Object.assign(new Error(`Student already has bag ${existing.bag_number}`), { status: 409 });

  const r = await pool.query(
    'UPDATE bags SET student_id = $1 WHERE id = $2 RETURNING id, bag_number, student_id',
    [studentId, bagId]
  );
  return r.rows[0];
}

async function unassignBag(bagId) {
  const r = await pool.query('UPDATE bags SET student_id = NULL WHERE id = $1 RETURNING id, bag_number', [bagId]);
  if (!r.rows[0]) throw Object.assign(new Error('Bag not found'), { status: 404 });
  return r.rows[0];
}

async function getMyBag(studentId) {
  const r = await pool.query(
    `SELECT b.id, b.bag_number, b.qr_token, b.issue_date, b.is_active
     FROM bags b WHERE b.student_id = $1`,
    [studentId]
  );
  return r.rows[0] || null;
}

// Worker scan: resolve opaque token → bag + student + latest ACTIVE order
async function scanByQrToken(qrToken, workerId) {
  const bag = (await pool.query(
    `SELECT b.id, b.bag_number, b.qr_token, b.issue_date, b.is_active, b.student_id,
            u.name AS student_name, st.enrollment_no, st.hostel, st.room_number, st.phone
     FROM bags b
     LEFT JOIN users u ON u.id = b.student_id
     LEFT JOIN students st ON st.user_id = b.student_id
     WHERE b.qr_token = $1`,
    [qrToken]
  )).rows[0];
  if (!bag) throw Object.assign(new Error('Unknown QR — bag not found'), { status: 404 });

  // Record the raw scan (audit) — best-effort
  await pool.query(
    'INSERT INTO scan_logs (bag_id, worker_id, stage, device) VALUES ($1, $2, $3, $4)',
    [bag.id, workerId || null, null, 'scan']
  );

  const order = (await pool.query(
    `SELECT o.id, o.current_stage, o.current_stage_started_at, o.exception_state,
            o.expected_completion_time, o.collection_otp, o.rework_count,
            h.name AS current_handler_name
     FROM orders o
     LEFT JOIN users h ON h.id = o.current_handler_id
     WHERE o.bag_id = $1 AND o.current_stage <> 'delivered'
     ORDER BY o.created_at DESC LIMIT 1`,
    [bag.id]
  )).rows[0] || null;

  let activeOrder = null;
  if (order) {
    const items = await pool.query(
      'SELECT item_type, category, quantity FROM order_items WHERE order_id = $1', [order.id]
    );
    activeOrder = { ...order, items: items.rows };
  }

  const student = bag.student_id
    ? { id: bag.student_id, name: bag.student_name, enrollment_no: bag.enrollment_no,
        hostel: bag.hostel, room_number: bag.room_number, phone: bag.phone }
    : null;

  return {
    bag: { id: bag.id, bag_number: bag.bag_number, qr_token: bag.qr_token,
           issue_date: bag.issue_date, is_active: bag.is_active },
    student,
    active_order: activeOrder,
  };
}

module.exports = {
  createBag, createBulkBags, listBags, getBag,
  assignBag, unassignBag, getMyBag, scanByQrToken,
};
