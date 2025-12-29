const { prisma } = require('../db/prisma');
const { NotFound, Conflict } = require('../utils/errors');
const { writeAudit } = require('../utils/audit');

exports.getAll = async (req, res, next) => {
  try {
    const data = await prisma.kunde.findMany({ where: { tenantId: req.user.tenantId }, orderBy: { createdAt: 'desc' } });
    res.json({ data });
  } catch(e){ next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const k = await prisma.kunde.findFirst({ where: { tenantId: req.user.tenantId, id: req.params.id } });
    if (!k) return next(new NotFound('Kunde nicht gefunden'));
    res.json(k);
  } catch(e){ next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const created = await prisma.kunde.create({ data: { tenantId:req.user.tenantId, ...req.body } });
    await writeAudit({ tenantId:req.user.tenantId, userId:req.user.sub, type:'kunden.create', data:{ kundeId: created.id } });
    res.status(201).json(created);
  } catch(e){ next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const exists = await prisma.kunde.findFirst({ where: { tenantId:req.user.tenantId, id:req.params.id } });
    if (!exists) return next(new NotFound('Kunde nicht gefunden'));
    const updated = await prisma.kunde.update({ where: { id: req.params.id }, data: req.body });
    await writeAudit({ tenantId:req.user.tenantId, userId:req.user.sub, type:'kunden.update', data:{ kundeId: updated.id } });
    res.json(updated);
  } catch(e){ next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    const count = await prisma.termin.count({ where: { tenantId, kundeId: id } });
    if (count > 0) return next(new Conflict('Kunde hat noch Termine'));
    const exists = await prisma.kunde.findFirst({ where: { tenantId, id } });
    if (!exists) return next(new NotFound('Kunde nicht gefunden'));
    await prisma.kunde.delete({ where: { id } });
    await writeAudit({ tenantId, userId:req.user.sub, type:'kunden.delete', data:{ kundeId: id } });
    res.status(204).send();
  } catch(e){ next(e); }
};

exports.getTermineVonKunde = async (req, res, next) => {
  try {
    const tenantId=req.user.tenantId;
    const kundeId=req.params.id;
    const kunde = await prisma.kunde.findFirst({ where:{ tenantId, id:kundeId } });
    if (!kunde) return next(new NotFound('Kunde nicht gefunden'));

    const where = { tenantId, kundeId };
    if (req.query.datum) where['datum'] = req.query.datum;
    if (req.query.serviceId) where['serviceId'] = req.query.serviceId;

    const page = Number.parseInt(req.query.page || '1', 10) || 1;
    const limit = Number.parseInt(req.query.limit || '20', 10) || 20;
    const skip = (page-1)*limit;

    const [total, data] = await Promise.all([
      prisma.termin.count({ where }),
      prisma.termin.findMany({
        where,
        orderBy: [{ datum:'asc' }, { zeit:'asc' }],
        skip, take: limit,
        include: { service:true }
      })
    ]);

    res.json({ page, limit, total, data: data.map(t => ({ ...t, kunde })) });
  } catch(e){ next(e); }
};
