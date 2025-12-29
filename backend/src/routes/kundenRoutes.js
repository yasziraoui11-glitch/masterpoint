const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../schemas');
const ctrl = require('../controllers/kundenController');

router.use(requireAuth);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/termine', ctrl.getTermineVonKunde);
router.post('/', validate(schemas.kundenCreate,'body'), ctrl.create);
router.put('/:id', validate(schemas.kundenUpdate,'body'), ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
