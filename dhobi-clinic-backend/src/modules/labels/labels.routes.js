const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/roleGuard');
const { streamLabels } = require('./labels.service');

router.use(authenticate, requireRole('admin'));

// Single bag label
router.get('/bags/:id/label.pdf', async (req, res, next) => {
  try { await streamLabels([req.params.id], res); } catch (err) { next(err); }
});

// Batch labels: body { bag_ids: [...] }
router.post('/bags/labels.pdf', async (req, res, next) => {
  try {
    const ids = req.body.bag_ids;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'bag_ids array required' });
    await streamLabels(ids, res);
  } catch (err) { next(err); }
});

module.exports = router;
