const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../schemas');
const ctrl = require('../controllers/termineController');

router.use(requireAuth);
router.get('/', validate(schemas.terminQuery,'query'), ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(schemas.terminCreate,'body'), ctrl.create);
router.put('/:id', validate(schemas.terminUpdate,'body'), ctrl.update);
router.post('/:id/confirm', ctrl.confirm);
router.post('/:id/cancel', ctrl.cancel);
router.post('/:id/complete', ctrl.complete);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
