const { logger } = require('./logger');
module.exports = (err, req, res, next) => {
  const status = Number(err.statusCode) || 500;
  const payload = { error: err.message || 'Serverfehler', requestId: req.requestId };
  if (err.details) payload.details = err.details;
  if (status >= 500) logger.error({ err, requestId: req.requestId }, 'Unhandled error');
  res.status(status).json(payload);
};
