const { prisma } = require('../db/prisma');
const { NotFound } = require('../utils/errors');
const { writeAudit } = require('../utils/audit');

exports.getAll = async (req, res, next) => {
  try {
    const data = await prisma.service.findMany({ where: { tenantId:req.user.tenantId }, orderBy: { createdAt:'desc' } });
    res.json({ data });
  } catch(e){ next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const s = await prisma.service.findFirst({ where: { tenantId:req.user.tenantId, id:req.params.id } });
    if (!s) return next(new NotFound('Service nicht gefunden'));
    res.json(s);
  } catch(e){ next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const created = await prisma.service.create({ data: { tenantId:req.user.tenantId, ...req.body } });
    await writeAudit({ tenantId:req.user.tenantId, userId:req.user.sub, type:'services.create', data:{ serviceId: created.id } });
    res.status(201).json(created);
  } catch(e){ next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const exists = await prisma.service.findFirst({ where: { tenantId:req.user.tenantId, id:req.params.id } });
    if (!exists) return next(new NotFound('Service nicht gefunden'));
    const updated = await prisma.service.update({ where: { id:req.params.id }, data:req.body });
    await writeAudit({ tenantId:req.user.tenantId, userId:req.user.sub, type:'services.update', data:{ serviceId: updated.id } });
    res.json(updated);
  } catch(e){ next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const exists = await prisma.service.findFirst({ where: { tenantId:req.user.tenantId, id:req.params.id } });
    if (!exists) return next(new NotFound('Service nicht gefunden'));
    await prisma.service.delete({ where: { id:req.params.id } });
    await writeAudit({ tenantId:req.user.tenantId, userId:req.user.sub, type:'services.delete', data:{ serviceId: req.params.id } });
    res.status(204).send();
  } catch(e){ next(e); }
};
