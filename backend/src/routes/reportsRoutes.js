const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/reportsController');

router.use(requireAuth, requireRole('admin'));
router.get('/umsatz', ctrl.umsatz);

module.exports = router;
