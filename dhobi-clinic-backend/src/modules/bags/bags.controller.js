const svc = require('./bags.service');

async function createBag(req, res, next) {
  try { res.status(201).json(await svc.createBag(req.body.student_id || null)); }
  catch (err) { next(err); }
}

async function createBulk(req, res, next) {
  try { res.status(201).json(await svc.createBulkBags(req.body.count)); }
  catch (err) { next(err); }
}

async function listBags(req, res, next) {
  try { res.json(await svc.listBags(req.query)); }
  catch (err) { next(err); }
}

async function getBag(req, res, next) {
  try { res.json(await svc.getBag(req.params.id)); }
  catch (err) { next(err); }
}

async function assignBag(req, res, next) {
  try {
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ error: 'student_id is required' });
    res.json(await svc.assignBag(req.params.id, student_id));
  } catch (err) { next(err); }
}

async function unassignBag(req, res, next) {
  try { res.json(await svc.unassignBag(req.params.id)); }
  catch (err) { next(err); }
}

async function myBag(req, res, next) {
  try { res.json(await svc.getMyBag(req.user.id)); }
  catch (err) { next(err); }
}

async function scan(req, res, next) {
  try { res.json(await svc.scanByQrToken(req.params.qrToken, req.user.id)); }
  catch (err) { next(err); }
}

module.exports = { createBag, createBulk, listBags, getBag, assignBag, unassignBag, myBag, scan };
