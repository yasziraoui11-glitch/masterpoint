const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../schemas');
const ctrl = require('../controllers/servicesController');

router.use(requireAuth);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('admin'), validate(schemas.serviceCreate,'body'), ctrl.create);
router.put('/:id', requireRole('admin'), validate(schemas.serviceUpdate,'body'), ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
