const { BadRequest } = require('../utils/errors');
function validate(schema, where='body') {
  return (req, res, next) => {
    const data = where==='query' ? req.query : (where==='params' ? req.params : req.body);
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const details = parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return next(new BadRequest('Validierungsfehler', details));
    }
    if (where==='query') req.query = parsed.data;
    if (where==='params') req.params = parsed.data;
    if (where==='body') req.body = parsed.data;
    next();
  };
}
module.exports = { validate };
