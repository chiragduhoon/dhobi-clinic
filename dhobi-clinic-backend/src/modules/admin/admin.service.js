const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const notifications = require('../notifications/notifications.service');

const EXCEPTION_STATES = ['on_hold', 'damaged', 'reported_missing', 'investigation'];
const STAGES = ['requested', 'submitted', 'accepted', 'sorting', 'washing',
  'drying', 'ironing', 'quality_check', 'ready_for_collection', 'delivered'];

// ---------- User / worker management ----------
async function listUsers({ role, page = 1, limit = 25, search } = {}) {
  const offset = (page - 1) * limit;
  const cond = [], params = []; let i = 1;
  if (role) { cond.push(`u.role = $${i++}`); params.push(role); }
  if (search) { cond.push(`(u.name ILIKE $${i} OR u.email ILIKE $${i} OR st.enrollment_no ILIKE $${i})`); params.push(`%${search}%`); i++; }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  const rows = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
            st.enrollment_no, st.hostel, st.room_number,
            wk.staff_code, wk.specialty_role
     FROM users u
     LEFT JOIN students st ON st.user_id = u.id
     LEFT JOIN staff wk ON wk.user_id = u.id
     ${where} ORDER BY u.created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );
  const total = await pool.query(
    `SELECT COUNT(*) FROM users u LEFT JOIN students st ON st.user_id=u.id ${where}`, params);
  return { page: Number(page), total: Number(total.rows[0].count), users: rows.rows };
}

async function createUser({ name, email, password, role, enrollment_no, hostel, room_number, phone, staff_code, specialty_role }) {
  if (!name || !email || !password || !role) throw Object.assign(new Error('name, email, password, role required'), { status: 400 });
  if (!['student', 'worker', 'admin'].includes(role)) throw Object.assign(new Error('invalid role'), { status: 400 });
  const exists = (await pool.query('SELECT id FROM users WHERE email=$1', [email])).rows[0];
  if (exists) throw Object.assign(new Error('Email already exists'), { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const u = (await client.query(
      'INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,is_active,created_at',
      [name, email, hash, role])).rows[0];
    if (role === 'student') {
      await client.query('INSERT INTO students (user_id,enrollment_no,hostel,room_number,phone) VALUES ($1,$2,$3,$4,$5)',
        [u.id, enrollment_no || null, hostel || null, room_number || null, phone || null]);
    } else if (role === 'worker') {
      await client.query('INSERT INTO staff (user_id,staff_code,specialty_role,phone) VALUES ($1,$2,$3,$4)',
        [u.id, staff_code || null, specialty_role || null, phone || null]);
    }
    await client.query('COMMIT');
    return u;
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') throw Object.assign(new Error('Duplicate enrollment/staff code'), { status: 409 });
    throw err;
  } finally { client.release(); }
}

async function updateUser(id, body) {
  const u = (await pool.query('SELECT role FROM users WHERE id=$1', [id])).rows[0];
  if (!u) throw Object.assign(new Error('User not found'), { status: 404 });
  if (body.name !== undefined || body.is_active !== undefined) {
    await pool.query('UPDATE users SET name=COALESCE($2,name), is_active=COALESCE($3,is_active), updated_at=NOW() WHERE id=$1',
      [id, body.name ?? null, body.is_active ?? null]);
  }
  if (u.role === 'student') {
    await pool.query('UPDATE students SET hostel=COALESCE($2,hostel), room_number=COALESCE($3,room_number), phone=COALESCE($4,phone) WHERE user_id=$1',
      [id, body.hostel ?? null, body.room_number ?? null, body.phone ?? null]);
  } else if (u.role === 'worker') {
    await pool.query('UPDATE staff SET specialty_role=COALESCE($2,specialty_role), phone=COALESCE($3,phone) WHERE user_id=$1',
      [id, body.specialty_role ?? null, body.phone ?? null]);
  }
  return { ok: true };
}

async function deactivateUser(id) {
  const r = await pool.query('UPDATE users SET is_active=FALSE, updated_at=NOW() WHERE id=$1 RETURNING id', [id]);
  if (!r.rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
  return { ok: true };
}

// ---------- Orders list (filterable, paginated) ----------
async function listOrders({ stage, hostel, date, exception, page = 1, limit = 25 } = {}) {
  const offset = (page - 1) * limit;
  const cond = [], params = []; let i = 1;
  if (stage) { cond.push(`o.current_stage = $${i++}`); params.push(stage); }
  if (hostel) { cond.push(`st.hostel = $${i++}`); params.push(hostel); }
  if (date) { cond.push(`o.submitted_at::date = $${i++}`); params.push(date); }
  if (exception === 'true') cond.push('o.exception_state IS NOT NULL');
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  const rows = await pool.query(
    `SELECT o.id, o.current_stage, o.exception_state, o.expected_completion_time, o.submitted_at, o.delivered_at,
            b.bag_number, s.name AS student_name, st.enrollment_no, st.hostel, st.room_number,
            h.name AS current_handler_name
     FROM orders o
     JOIN bags b ON b.id=o.bag_id
     JOIN users s ON s.id=o.student_id
     LEFT JOIN students st ON st.user_id=o.student_id
     LEFT JOIN users h ON h.id=o.current_handler_id
     ${where} ORDER BY o.submitted_at DESC NULLS LAST LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );
  const total = await pool.query(
    `SELECT COUNT(*) FROM orders o JOIN bags b ON b.id=o.bag_id LEFT JOIN students st ON st.user_id=o.student_id ${where}`, params);
  return { page: Number(page), total: Number(total.rows[0].count), orders: rows.rows };
}

// ---------- Exceptions ----------
async function setException(orderId, state, notes, adminId) {
  if (!EXCEPTION_STATES.includes(state)) throw Object.assign(new Error('Invalid exception state'), { status: 400 });
  const o = (await pool.query('SELECT id,bag_id,student_id,current_stage FROM orders WHERE id=$1', [orderId])).rows[0];
  if (!o) throw Object.assign(new Error('Order not found'), { status: 404 });
  await pool.query('UPDATE orders SET exception_state=$1, updated_at=NOW() WHERE id=$2', [state, orderId]);
  await pool.query(
    `INSERT INTO stage_logs (order_id,bag_id,stage,worker_id,kind,notes) VALUES ($1,$2,$3,$4,'exception',$5)`,
    [orderId, o.bag_id, o.current_stage, adminId, `Marked ${state}${notes ? ': ' + notes : ''}`]);
  const bagNo = (await pool.query('SELECT bag_number FROM bags WHERE id=$1', [o.bag_id])).rows[0]?.bag_number;
  await notifications.createNotification(o.student_id, 'exception', 'Laundry Update',
    `Your bag ${bagNo} is now marked "${state.replace('_', ' ')}". The laundry team is handling it.`, { orderId, bagId: o.bag_id });
  return { ok: true, exception_state: state };
}

async function clearException(orderId, notes, adminId) {
  const o = (await pool.query('SELECT id,bag_id,student_id,current_stage,exception_state FROM orders WHERE id=$1', [orderId])).rows[0];
  if (!o) throw Object.assign(new Error('Order not found'), { status: 404 });
  if (!o.exception_state) throw Object.assign(new Error('Order has no exception to clear'), { status: 400 });
  await pool.query('UPDATE orders SET exception_state=NULL, updated_at=NOW() WHERE id=$1', [orderId]);
  await pool.query(
    `INSERT INTO stage_logs (order_id,bag_id,stage,worker_id,kind,notes) VALUES ($1,$2,$3,$4,'exception',$5)`,
    [orderId, o.bag_id, o.current_stage, adminId, `Cleared ${o.exception_state}${notes ? ': ' + notes : ''}`]);
  const bagNo = (await pool.query('SELECT bag_number FROM bags WHERE id=$1', [o.bag_id])).rows[0]?.bag_number;
  await notifications.createNotification(o.student_id, 'exception', 'Laundry Update',
    `Your bag ${bagNo} is back in normal processing.`, { orderId, bagId: o.bag_id });
  return { ok: true };
}

// ---------- Rework (send back one stage) ----------
async function rework(orderId, notes, adminId) {
  const o = (await pool.query('SELECT id,bag_id,current_stage,exception_state FROM orders WHERE id=$1', [orderId])).rows[0];
  if (!o) throw Object.assign(new Error('Order not found'), { status: 404 });
  if (o.exception_state) throw Object.assign(new Error('Clear the exception first'), { status: 409 });
  const idx = STAGES.indexOf(o.current_stage);
  if (idx <= 2) throw Object.assign(new Error('Nothing to rework before acceptance'), { status: 400 });
  const prev = STAGES[idx - 1];
  await pool.query('UPDATE orders SET current_stage=$1, current_stage_started_at=NOW(), rework_count=rework_count+1, updated_at=NOW() WHERE id=$2', [prev, orderId]);
  await pool.query(
    `INSERT INTO stage_logs (order_id,bag_id,stage,worker_id,kind,notes) VALUES ($1,$2,$3,$4,'rework',$5)`,
    [orderId, o.bag_id, prev, adminId, `Sent back to ${prev} for rework${notes ? ': ' + notes : ''}`]);
  return { ok: true, current_stage: prev };
}

// ---------- Bag audit trail (paginated, merged stage + scan logs) ----------
async function bagAudit(bagId, page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const bag = (await pool.query(
    `SELECT b.bag_number, u.name AS student_name, st.enrollment_no, st.hostel, st.room_number
     FROM bags b LEFT JOIN users u ON u.id=b.student_id LEFT JOIN students st ON st.user_id=b.student_id
     WHERE b.id=$1`, [bagId])).rows[0];
  if (!bag) throw Object.assign(new Error('Bag not found'), { status: 404 });
  const events = await pool.query(
    `SELECT 'stage' AS type, sl.stage, sl.kind, sl.notes, w.name AS worker_name, sl.completed_at AS at
       FROM stage_logs sl LEFT JOIN users w ON w.id=sl.worker_id WHERE sl.bag_id=$1
     UNION ALL
     SELECT 'scan' AS type, scl.stage, NULL, scl.remarks, w.name, scl.scanned_at AS at
       FROM scan_logs scl LEFT JOIN users w ON w.id=scl.worker_id WHERE scl.bag_id=$1
     ORDER BY at DESC LIMIT $2 OFFSET $3`,
    [bagId, limit, offset]);
  return { bag, page: Number(page), events: events.rows };
}

// ---------- Dashboard stats ----------
async function getStats() {
  const s = (await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE submitted_at::date = CURRENT_DATE) AS today_orders,
      COUNT(*) FILTER (WHERE current_stage NOT IN ('delivered')) AS in_progress,
      COUNT(*) FILTER (WHERE current_stage = 'ready_for_collection') AS ready,
      COUNT(*) FILTER (WHERE current_stage = 'delivered') AS completed,
      COUNT(*) FILTER (WHERE exception_state IS NOT NULL) AS exceptions,
      COUNT(*) FILTER (WHERE current_stage <> 'delivered' AND expected_completion_time < NOW()) AS delayed,
      COUNT(*) FILTER (WHERE delivered_at IS NOT NULL AND actual_completion_time <= expected_completion_time) AS on_time,
      COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - submitted_at))) FILTER (WHERE delivered_at IS NOT NULL),0)/3600 AS avg_completion_hours
    FROM orders`)).rows[0];
  const hostel = (await pool.query(
    `SELECT st.hostel, COUNT(*) AS c FROM orders o JOIN students st ON st.user_id=o.student_id
     WHERE st.hostel IS NOT NULL GROUP BY st.hostel ORDER BY c DESC LIMIT 1`)).rows[0];
  const worker = (await pool.query(
    `SELECT w.name, COUNT(*) AS c FROM stage_logs sl JOIN users w ON w.id=sl.worker_id
     WHERE sl.kind='advance' GROUP BY w.name ORDER BY c DESC LIMIT 1`)).rows[0];
  return {
    today_orders: Number(s.today_orders), in_progress: Number(s.in_progress),
    ready: Number(s.ready), completed: Number(s.completed), exceptions: Number(s.exceptions),
    delayed: Number(s.delayed), on_time: Number(s.on_time),
    avg_completion_hours: Math.round(Number(s.avg_completion_hours) * 10) / 10,
    most_active_hostel: hostel ? { hostel: hostel.hostel, count: Number(hostel.c) } : null,
    most_active_worker: worker ? { name: worker.name, count: Number(worker.c) } : null,
  };
}

// ---------- Worker productivity ----------
async function getProductivity() {
  const rows = await pool.query(`
    SELECT w.id, w.name,
      COUNT(sl.*) FILTER (WHERE sl.kind='advance') AS stages_completed,
      COALESCE(ROUND(AVG(sl.duration_seconds) FILTER (WHERE sl.kind='advance')/60.0,1),0) AS avg_stage_minutes,
      COUNT(sl.*) FILTER (WHERE sl.kind='rework') AS rework_count,
      (SELECT COUNT(*) FROM orders o WHERE o.delivery_verified_by=w.id
         AND o.actual_completion_time > o.expected_completion_time) AS late_deliveries
    FROM users w LEFT JOIN stage_logs sl ON sl.worker_id=w.id
    WHERE w.role='worker'
    GROUP BY w.id, w.name ORDER BY stages_completed DESC`);
  return rows.rows.map(r => {
    const stages = Number(r.stages_completed), rework = Number(r.rework_count), late = Number(r.late_deliveries);
    return {
      id: r.id, name: r.name, stages_completed: stages,
      avg_stage_minutes: Number(r.avg_stage_minutes), rework_count: rework, late_deliveries: late,
      productivity_score: stages - 2 * late - rework,
    };
  });
}

// ---------- Live bag board (active bags + current handler/stage) ----------
async function liveBoard({ page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;
  const rows = await pool.query(
    `SELECT o.id, b.bag_number, o.current_stage, o.exception_state, o.expected_completion_time,
            (o.current_stage <> 'delivered' AND o.expected_completion_time < NOW()) AS delayed,
            s.name AS student_name, st.hostel, st.room_number, h.name AS current_handler_name
     FROM orders o
     JOIN bags b ON b.id=o.bag_id
     JOIN users s ON s.id=o.student_id
     LEFT JOIN students st ON st.user_id=o.student_id
     LEFT JOIN users h ON h.id=o.current_handler_id
     WHERE o.current_stage <> 'delivered'
     ORDER BY o.expected_completion_time ASC NULLS LAST LIMIT $1 OFFSET $2`,
    [limit, offset]);
  const total = await pool.query("SELECT COUNT(*) FROM orders WHERE current_stage <> 'delivered'");
  return { page: Number(page), total: Number(total.rows[0].count), bags: rows.rows };
}

module.exports = {
  listUsers, createUser, updateUser, deactivateUser,
  listOrders, setException, clearException, rework, bagAudit,
  getStats, getProductivity, liveBoard,
};
