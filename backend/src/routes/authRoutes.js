const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../schemas');
const ctrl = require('../controllers/authController');

router.post('/login', validate(schemas.login,'body'), ctrl.login);
router.get('/me', requireAuth, ctrl.me);
router.get('/users', requireAuth, requireRole('admin'), ctrl.listUsers);
router.post('/users', requireAuth, requireRole('admin'), validate(schemas.userCreate,'body'), ctrl.createUser);

module.exports = router;
