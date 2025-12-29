const { randomUUID } = require('crypto');
module.exports = (req, res, next) => {
  const incoming = req.header('x-request-id');
  const id = incoming && String(incoming).trim() ? String(incoming).trim() : randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
};
