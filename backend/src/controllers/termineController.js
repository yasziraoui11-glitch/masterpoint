const { prisma } = require('../db/prisma');
const { NotFound, BadRequest } = require('../utils/errors');
const { writeAudit } = require('../utils/audit');
const { enforceBusinessRules } = require('../services/terminService');

function canTransition(current, target) {
  const allowed = {
    planned: ['confirmed','cancelled','completed'],
    confirmed: ['cancelled','completed'],
    cancelled: [],
    completed: [],
    no_show: ['completed'],
  };
  return (allowed[current] || []).includes(target);
}

exports.getAll = async (req, res, next) => {
  try {
    const tenantId=req.user.tenantId;
    const where = { tenantId };
    if (req.query.datum) where['datum'] = req.query.datum;
    if (req.query.kundeId) where['kundeId'] = req.query.kundeId;
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
        include: { kunde:true, service:true }
      })
    ]);

    res.json({ page, limit, total, data });
  } catch(e){ next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const t = await prisma.termin.findFirst({ where: { tenantId:req.user.tenantId, id:req.params.id }, include:{ kunde:true, service:true } });
    if (!t) return next(new NotFound('Termin nicht gefunden'));
    res.json(t);
  } catch(e){ next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const tenantId=req.user.tenantId;
    const candidate = { ...req.body, tenantId };
    const endzeit = await enforceBusinessRules(tenantId, candidate, null);

    const created = await prisma.termin.create({
      data: { tenantId, datum:req.body.datum, zeit:req.body.zeit, endzeit, notiz:req.body.notiz, kundeId:req.body.kundeId || null, serviceId:req.body.serviceId || null }
    });

    await writeAudit({ tenantId, userId:req.user.sub, type:'termine.create', data:{ terminId: created.id } });
    res.status(201).json(created);
  } catch(e){ next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const tenantId=req.user.tenantId;
    const existing = await prisma.termin.findFirst({ where: { tenantId, id:req.params.id } });
    if (!existing) return next(new NotFound('Termin nicht gefunden'));

    const merged = { ...existing, ...req.body, tenantId, id: existing.id };
    const endzeit = await enforceBusinessRules(tenantId, merged, existing.id);

    const updated = await prisma.termin.update({
      where: { id: existing.id },
      data: { ...req.body, endzeit }
    });

    await writeAudit({ tenantId, userId:req.user.sub, type:'termine.update', data:{ terminId: updated.id } });
    res.json(updated);
  } catch(e){ next(e); }
};

async function setStatus(req, res, next, target) {
  try {
    const tenantId=req.user.tenantId;
    const t = await prisma.termin.findFirst({ where: { tenantId, id:req.params.id } });
    if (!t) return next(new NotFound('Termin nicht gefunden'));
    if (!canTransition(t.status, target)) return next(new BadRequest('Statuswechsel nicht erlaubt'));

    const now = new Date();
    const patch = { status: target };
    if (target==='confirmed') patch['confirmedAt']=now;
    if (target==='cancelled') patch['cancelledAt']=now;
    if (target==='completed') patch['completedAt']=now;
    if (target==='no_show') patch['noShowAt']=now;

    const updated = await prisma.termin.update({ where: { id: t.id }, data: patch });
    await writeAudit({ tenantId, userId:req.user.sub, type:`termine.status.${target}`, data:{ terminId: updated.id } });
    res.json(updated);
  } catch(e){ next(e); }
}

exports.confirm = (req,res,next)=>setStatus(req,res,next,'confirmed');
exports.cancel  = (req,res,next)=>setStatus(req,res,next,'cancelled');
exports.complete= (req,res,next)=>setStatus(req,res,next,'completed');

exports.remove = async (req, res, next) => {
  try {
    const tenantId=req.user.tenantId;
    const exists = await prisma.termin.findFirst({ where: { tenantId, id:req.params.id } });
    if (!exists) return next(new NotFound('Termin nicht gefunden'));
    await prisma.termin.delete({ where: { id: req.params.id } });
    await writeAudit({ tenantId, userId:req.user.sub, type:'termine.delete', data:{ terminId: req.params.id } });
    res.status(204).send();
  } catch(e){ next(e); }
};
