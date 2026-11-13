const svc = require('./admin.service');

const wrap = (fn) => async (req, res, next) => { try { res.json(await fn(req)); } catch (err) { next(err); } };

function toCsv(rows, columns) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(',')).join('\n');
  return head + '\n' + body;
}

async function ordersReportCsv(req, res, next) {
  try {
    const { orders } = await svc.listOrders({ ...req.query, limit: 5000, page: 1 });
    const csv = toCsv(orders, [
      { key: 'bag_number', label: 'Bag' }, { key: 'student_name', label: 'Student' },
      { key: 'enrollment_no', label: 'Enrollment' }, { key: 'hostel', label: 'Hostel' },
      { key: 'current_stage', label: 'Stage' }, { key: 'exception_state', label: 'Exception' },
      { key: 'submitted_at', label: 'Submitted' }, { key: 'delivered_at', label: 'Delivered' },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders-report.csv"');
    res.send(csv);
  } catch (err) { next(err); }
}

async function productivityReportCsv(req, res, next) {
  try {
    const rows = await svc.getProductivity();
    const csv = toCsv(rows, [
      { key: 'name', label: 'Worker' }, { key: 'stages_completed', label: 'Stages' },
      { key: 'avg_stage_minutes', label: 'Avg Min/Stage' }, { key: 'rework_count', label: 'Rework' },
      { key: 'late_deliveries', label: 'Late' }, { key: 'productivity_score', label: 'Score' },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="productivity-report.csv"');
    res.send(csv);
  } catch (err) { next(err); }
}

module.exports = {
  listUsers: wrap((req) => svc.listUsers(req.query)),
  createUser: async (req, res, next) => { try { res.status(201).json(await svc.createUser(req.body)); } catch (e) { next(e); } },
  updateUser: wrap((req) => svc.updateUser(req.params.id, req.body)),
  deactivateUser: wrap((req) => svc.deactivateUser(req.params.id)),
  listOrders: wrap((req) => svc.listOrders(req.query)),
  setException: wrap((req) => svc.setException(req.params.id, req.body.state, req.body.notes, req.user.id)),
  clearException: wrap((req) => svc.clearException(req.params.id, req.body.notes, req.user.id)),
  rework: wrap((req) => svc.rework(req.params.id, req.body.notes, req.user.id)),
  bagAudit: wrap((req) => svc.bagAudit(req.params.id, Number(req.query.page) || 1)),
  getStats: wrap(() => svc.getStats()),
  getProductivity: wrap(() => svc.getProductivity()),
  liveBoard: wrap((req) => svc.liveBoard(req.query)),
  ordersReportCsv,
  productivityReportCsv,
};
