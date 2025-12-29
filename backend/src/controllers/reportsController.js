const { prisma } = require('../db/prisma');
const { BadRequest } = require('../utils/errors');
const { isISODate } = require('../utils/time');

function within(d, from, to) {
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

exports.umsatz = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (from && !isISODate(from)) throw new BadRequest('from muss YYYY-MM-DD sein');
    if (to && !isISODate(to)) throw new BadRequest('to muss YYYY-MM-DD sein');

    const tenantId = req.user.tenantId;

    const termine = await prisma.termin.findMany({
      where: { tenantId, status: 'completed' },
      include: { service: true }
    });

    const filtered = termine.filter(t => within(t.datum, from, to));
    const total = filtered.reduce((sum, t) => sum + (t.service?.preis || 0), 0);

    res.json({ from: from || null, to: to || null, total, count: filtered.length });
  } catch(e){ next(e); }
};
