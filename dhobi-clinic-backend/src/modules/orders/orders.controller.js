const svc = require('./orders.service');
const pool = require('../../config/db');

async function createOrder(req, res, next) {
  try { res.status(201).json(await svc.createOrder(req.user.id, req.body)); }
  catch (err) { next(err); }
}
async function myOrders(req, res, next) {
  try { res.json(await svc.getMyOrders(req.user.id)); }
  catch (err) { next(err); }
}
async function orderDetail(req, res, next) {
  try { res.json(await svc.getOrderDetail(req.params.id, req.user)); }
  catch (err) { next(err); }
}
async function laundryHistory(req, res, next) {
  try { res.json(await svc.getLaundryHistory(req.user.id)); }
  catch (err) { next(err); }
}
async function completeStage(req, res, next) {
  try { res.json(await svc.completeStage(req.params.id, req.user.id, req.body.notes, req.body.device, req.body.expected_stage)); }
  catch (err) { next(err); }
}
async function deliver(req, res, next) {
  try {
    if (!req.body.otp) return res.status(400).json({ error: 'otp is required' });
    res.json(await svc.deliver(req.params.id, req.user.id, req.body.otp));
  } catch (err) { next(err); }
}

// Worker workload: active orders this worker most recently handled
async function staffWorkload(req, res, next) {
  try {
    const r = await pool.query(
      `SELECT o.id, o.current_stage, o.expected_completion_time, b.bag_number,
              s.name AS student_name, st.hostel, st.room_number
       FROM orders o
       JOIN bags b ON b.id = o.bag_id
       JOIN users s ON s.id = o.student_id
       LEFT JOIN students st ON st.user_id = o.student_id
       WHERE o.current_handler_id = $1 AND o.current_stage <> 'delivered'
       ORDER BY o.current_stage_started_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch (err) { next(err); }
}

// Worker history (paginated): stages this worker completed
async function staffHistory(req, res, next) {
  try {
    const page = Number(req.query.page) || 1, limit = 30, offset = (page - 1) * limit;
    const r = await pool.query(
      `SELECT sl.stage, sl.notes, sl.completed_at, b.bag_number
       FROM stage_logs sl JOIN bags b ON b.id = sl.bag_id
       WHERE sl.worker_id = $1 ORDER BY sl.completed_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json(r.rows);
  } catch (err) { next(err); }
}

module.exports = {
  createOrder, myOrders, orderDetail, laundryHistory,
  completeStage, deliver, staffWorkload, staffHistory,
};
