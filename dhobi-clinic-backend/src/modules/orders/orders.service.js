const pool = require('../../config/db');
const notifications = require('../notifications/notifications.service');
const { STAGES, nextStage, isWithinSubmissionWindow,
  dailyLimitError, genOtp, otpMatches } = require('./rules');

// ---- Workflow definition (server-authoritative): stages + rules live in ./rules.js ----

// Stages a worker may advance via complete-stage (current_stage values).
// 'ready_for_collection' is excluded — delivery requires OTP verification.
const WORKER_ADVANCEABLE = new Set(['submitted', 'accepted', 'sorting', 'washing',
  'drying', 'ironing', 'quality_check']);

const STAGE_LABEL = {
  requested: 'Order Created', submitted: 'Bag Submitted', accepted: 'Accepted',
  sorting: 'Sorted', washing: 'Washed', drying: 'Dried', ironing: 'Ironed',
  quality_check: 'Quality Checked', ready_for_collection: 'Ready for Collection',
  delivered: 'Delivered',
};

// Categories that trigger a push/notification row (rest are timeline-only)
const PUSH_STAGES = { accepted: 'accepted', ready_for_collection: 'ready_for_collection', delivered: 'delivered' };

// ---- Bennett operational rules (caps, window, OTP: see ./rules.js) ----
const TURNAROUND_HOURS = 60;

// ---------- Create request (student submits bag) ----------
async function createOrder(studentId, { items, remarks, ack_color_bleed, ack_pockets_emptied }) {
  if (ack_color_bleed !== true || ack_pockets_emptied !== true) {
    throw Object.assign(new Error('You must accept the color-bleed and empty-pockets acknowledgements.'), { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('At least one garment is required.'), { status: 400 });
  }

  // Submission window 10:00–20:00, campus time
  if (!isWithinSubmissionWindow()) {
    throw Object.assign(new Error('Laundry submission is open only between 10:00 AM and 8:00 PM.'), { status: 403 });
  }

  // Student must have an assigned bag
  const bag = (await pool.query('SELECT id FROM bags WHERE student_id = $1 AND is_active = TRUE', [studentId])).rows[0];
  if (!bag) throw Object.assign(new Error('No laundry bag is assigned to you yet. Please collect your bag from the laundry counter.'), { status: 400 });

  // One active order per bag at a time
  const active = (await pool.query("SELECT id FROM orders WHERE bag_id = $1 AND current_stage <> 'delivered' LIMIT 1", [bag.id])).rows[0];
  if (active) throw Object.assign(new Error('You already have an active laundry order. Please collect it before submitting a new one.'), { status: 409 });

  // Validate items against catalog + resolve categories
  const catalog = (await pool.query('SELECT key, category FROM item_types WHERE is_active = TRUE')).rows
    .reduce((m, r) => (m[r.key] = r.category, m), {});
  let newLarge = 0, newSmall = 0;
  const resolved = [];
  for (const it of items) {
    const cat = catalog[it.item_type];
    if (!cat) throw Object.assign(new Error(`Unknown item type: ${it.item_type}`), { status: 400 });
    const qty = parseInt(it.quantity);
    if (!qty || qty < 1) continue;
    if (cat === 'large') newLarge += qty; else newSmall += qty;
    resolved.push({ item_type: it.item_type, category: cat, quantity: qty });
  }
  if (resolved.length === 0) throw Object.assign(new Error('At least one garment is required.'), { status: 400 });

  // Daily caps (today's already-submitted items + this order)
  const today = (await pool.query(
    `SELECT COALESCE(SUM(oi.quantity) FILTER (WHERE oi.category='large'),0) AS large,
            COALESCE(SUM(oi.quantity) FILTER (WHERE oi.category='small'),0) AS small
     FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE o.student_id = $1 AND o.submitted_at::date = CURRENT_DATE`,
    [studentId]
  )).rows[0];
  const limitError = dailyLimitError(today, { large: newLarge, small: newSmall });
  if (limitError) throw Object.assign(new Error(limitError), { status: 400 });

  // Create order at 'submitted', SLA clock starts now
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = (await client.query(
      `INSERT INTO orders (bag_id, student_id, current_stage, current_stage_started_at,
                           submitted_at, expected_completion_time, remarks,
                           ack_color_bleed, ack_pockets_emptied)
       VALUES ($1, $2, 'submitted', NOW(), NOW(), NOW() + ($3 || ' hours')::interval, $4, TRUE, TRUE)
       RETURNING id, current_stage, submitted_at, expected_completion_time`,
      [bag.id, studentId, String(TURNAROUND_HOURS), remarks || null]
    )).rows[0];

    for (const it of resolved) {
      await client.query(
        'INSERT INTO order_items (order_id, item_type, category, quantity) VALUES ($1,$2,$3,$4)',
        [order.id, it.item_type, it.category, it.quantity]
      );
    }
    // Timeline seed: request created + submitted (student action, no worker)
    await client.query(
      `INSERT INTO stage_logs (order_id, bag_id, stage, worker_id, kind, notes)
       VALUES ($1,$2,'submitted',NULL,'advance','Order created and bag submitted')`,
      [order.id, bag.id]
    );
    await client.query('COMMIT');
    return { order_id: order.id, current_stage: order.current_stage,
             expected_completion_time: order.expected_completion_time };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- Complete current stage (worker; concurrency-safe) ----------
// expectedStage (optional but sent by the app) = the stage the worker SAW when scanning.
// If the order has already moved past it (rapid double-scan or another worker), we reject —
// optimistic concurrency on top of the row lock, so a stage can never advance twice per scan.
async function completeStage(orderId, workerId, notes, device, expectedStage) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = (await client.query(
      'SELECT id, bag_id, student_id, current_stage, current_stage_started_at, exception_state FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    )).rows[0];
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.exception_state) throw Object.assign(new Error(`Order is on ${order.exception_state.replace('_', ' ')} — an admin must clear it before processing.`), { status: 409 });
    if (expectedStage && expectedStage !== order.current_stage) {
      throw Object.assign(new Error(`This bag has already moved to "${STAGE_LABEL[order.current_stage] || order.current_stage}". Re-scan to see the current stage.`), { status: 409 });
    }
    if (order.current_stage === 'delivered') throw Object.assign(new Error('Order already delivered.'), { status: 400 });
    if (order.current_stage === 'ready_for_collection') throw Object.assign(new Error('Order is ready — use OTP verification to deliver.'), { status: 400 });
    if (!WORKER_ADVANCEABLE.has(order.current_stage)) throw Object.assign(new Error(`Cannot advance from ${order.current_stage}.`), { status: 400 });

    const next = nextStage(order.current_stage);
    const duration = Math.max(0, Math.floor((Date.now() - new Date(order.current_stage_started_at).getTime()) / 1000));

    const setReady = next === 'ready_for_collection';
    const otp = setReady ? genOtp() : null;
    await client.query(
      `UPDATE orders SET current_stage = $1, current_stage_started_at = NOW(), current_handler_id = $2,
         ready_at = CASE WHEN $3 THEN NOW() ELSE ready_at END,
         collection_otp = COALESCE($4, collection_otp),
         otp_generated_at = CASE WHEN $3 THEN NOW() ELSE otp_generated_at END
       WHERE id = $5`,
      [next, workerId, setReady, otp, orderId]
    );
    await client.query(
      `INSERT INTO stage_logs (order_id, bag_id, stage, worker_id, kind, notes, duration_seconds)
       VALUES ($1,$2,$3,$4,'advance',$5,$6)`,
      [orderId, order.bag_id, next, workerId, notes || null, duration]
    );
    await client.query(
      `INSERT INTO scan_logs (bag_id, order_id, worker_id, stage, device) VALUES ($1,$2,$3,$4,$5)`,
      [order.bag_id, orderId, workerId, next, device || 'mobile']
    );
    await client.query('COMMIT');

    // Notify outside the txn (only push-worthy stages)
    const worker = (await pool.query('SELECT name FROM users WHERE id = $1', [workerId])).rows[0]?.name || 'staff';
    const bagNo = (await pool.query('SELECT bag_number FROM bags WHERE id = $1', [order.bag_id])).rows[0]?.bag_number;
    if (PUSH_STAGES[next]) {
      const title = next === 'ready_for_collection' ? 'Ready for Collection' : STAGE_LABEL[next];
      const body = next === 'ready_for_collection'
        ? `Your bag ${bagNo} is ready for collection. Show OTP ${otp} at the counter.`
        : `Your bag ${bagNo} has been ${STAGE_LABEL[next].toLowerCase()} by ${worker}.`;
      await notifications.createNotification(order.student_id, PUSH_STAGES[next], title, body,
        { orderId, bagId: order.bag_id });
    }
    return { order_id: orderId, current_stage: next, ...(otp ? { otp_generated: true } : {}) };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ---------- Deliver with OTP ----------
async function deliver(orderId, workerId, otp) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = (await client.query(
      'SELECT id, bag_id, student_id, current_stage, collection_otp, submitted_at, exception_state FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    )).rows[0];
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.exception_state) throw Object.assign(new Error('Order is under an exception state.'), { status: 409 });
    if (order.current_stage !== 'ready_for_collection') throw Object.assign(new Error('Order is not ready for collection yet.'), { status: 400 });
    if (!otpMatches(otp, order.collection_otp)) throw Object.assign(new Error('Incorrect collection OTP.'), { status: 400 });

    await client.query(
      `UPDATE orders SET current_stage='delivered', current_stage_started_at=NOW(),
         current_handler_id=$1, delivered_at=NOW(), actual_completion_time=NOW(),
         delivery_verified_by=$1, delivery_verified_at=NOW(), delivery_method='otp'
       WHERE id=$2`,
      [workerId, orderId]
    );
    await client.query(
      `INSERT INTO stage_logs (order_id, bag_id, stage, worker_id, kind, notes)
       VALUES ($1,$2,'delivered',$3,'advance','Collected by student (OTP verified)')`,
      [orderId, order.bag_id, workerId]
    );
    await client.query(
      `INSERT INTO scan_logs (bag_id, order_id, worker_id, stage, device) VALUES ($1,$2,$3,'delivered','mobile')`,
      [order.bag_id, orderId, workerId]
    );
    await client.query('COMMIT');

    const bagNo = (await pool.query('SELECT bag_number FROM bags WHERE id = $1', [order.bag_id])).rows[0]?.bag_number;
    await notifications.createNotification(order.student_id, 'delivered', 'Laundry Delivered',
      `Your bag ${bagNo} has been collected. Thank you!`, { orderId, bagId: order.bag_id });
    return { order_id: orderId, current_stage: 'delivered' };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ---------- Student reads ----------
async function getMyOrders(studentId) {
  const r = await pool.query(
    `SELECT o.id, o.current_stage, o.exception_state, o.expected_completion_time,
            o.submitted_at, o.delivered_at, b.bag_number,
            (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id = o.id) AS total_items
     FROM orders o JOIN bags b ON b.id = o.bag_id
     WHERE o.student_id = $1 ORDER BY o.created_at DESC`,
    [studentId]
  );
  return r.rows;
}

async function getOrderDetail(orderId, requester) {
  const o = (await pool.query(
    `SELECT o.*, b.bag_number, s.name AS student_name, st.enrollment_no, st.hostel, st.room_number,
            h.name AS current_handler_name
     FROM orders o
     JOIN bags b ON b.id = o.bag_id
     JOIN users s ON s.id = o.student_id
     LEFT JOIN students st ON st.user_id = o.student_id
     LEFT JOIN users h ON h.id = o.current_handler_id
     WHERE o.id = $1`,
    [orderId]
  )).rows[0];
  if (!o) throw Object.assign(new Error('Order not found'), { status: 404 });
  if (requester.role === 'student' && o.student_id !== requester.id) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  // Hide OTP from anyone but the owning student
  if (!(requester.role === 'student' && o.student_id === requester.id)) o.collection_otp = null;

  const items = await pool.query('SELECT item_type, category, quantity FROM order_items WHERE order_id = $1', [orderId]);
  const timeline = await pool.query(
    `SELECT sl.stage, sl.kind, sl.notes, sl.completed_at, w.name AS worker_name
     FROM stage_logs sl LEFT JOIN users w ON w.id = sl.worker_id
     WHERE sl.order_id = $1 ORDER BY sl.completed_at ASC`,
    [orderId]
  );
  o.items = items.rows;
  o.timeline = timeline.rows;
  return o;
}

async function getLaundryHistory(studentId) {
  const summary = (await pool.query(
    `SELECT COUNT(*) AS total_orders,
            COUNT(*) FILTER (WHERE current_stage='delivered') AS completed_orders,
            MAX(submitted_at) AS last_order_date,
            COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - submitted_at))) FILTER (WHERE delivered_at IS NOT NULL),0) AS avg_seconds
     FROM orders WHERE student_id = $1`,
    [studentId]
  )).rows[0];
  const clothes = (await pool.query(
    `SELECT COALESCE(SUM(oi.quantity),0) AS total_clothes
     FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.student_id=$1`,
    [studentId]
  )).rows[0];
  const frequent = (await pool.query(
    `SELECT oi.item_type, SUM(oi.quantity) AS qty
     FROM orders o JOIN order_items oi ON oi.order_id=o.id
     WHERE o.student_id=$1 GROUP BY oi.item_type ORDER BY qty DESC LIMIT 5`,
    [studentId]
  )).rows;
  return {
    total_orders: Number(summary.total_orders),
    completed_orders: Number(summary.completed_orders),
    total_clothes: Number(clothes.total_clothes),
    last_order_date: summary.last_order_date,
    avg_processing_hours: Math.round(Number(summary.avg_seconds) / 360) / 10,
    most_frequent_items: frequent,
  };
}

module.exports = {
  STAGES, STAGE_LABEL,
  createOrder, completeStage, deliver,
  getMyOrders, getOrderDetail, getLaundryHistory,
};
