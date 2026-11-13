const router = require('express').Router();
const authenticate = require('../../middleware/auth');
const pool = require('../../config/db');

// Item catalog for the student request UI (large vs small)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const r = await pool.query(
      'SELECT key, label, category FROM item_types WHERE is_active = TRUE ORDER BY category DESC, label'
    );
    res.json(r.rows);
  } catch (err) { next(err); }
});

module.exports = router;
