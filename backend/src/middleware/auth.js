const jwt = require('jsonwebtoken');
const config = require('../config');
const { Unauthorized, Forbidden } = require('../utils/errors');

function requireAuth(req, res, next) {
  const h = req.header('authorization') || '';
  const m = /^Bearer\s+(.+)$/.exec(h);
  if (!m) return next(new Unauthorized('Missing Bearer token'));
  try {
    req.user = jwt.verify(m[1], config.jwt.secret);
    return next();
  } catch {
    return next(new Unauthorized('Invalid token'));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new Unauthorized('Missing auth'));
    if (!roles.includes(req.user.role)) return next(new Forbidden('Insufficient role'));
    next();
  };
}

module.exports = { requireAuth, requireRole };
