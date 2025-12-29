const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { prisma } = require('../db/prisma');
const { Unauthorized, Conflict } = require('../utils/errors');
const { writeAudit } = require('../utils/audit');

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId, tenantName: user.tenant.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
    if (!user || !bcrypt.compareSync(String(password), String(user.passwordHash))) return next(new Unauthorized('Invalid credentials'));
    const token = issueToken(user);
    await writeAudit({ tenantId: user.tenantId, userId: user.id, type: 'auth.login' });
    res.json({ token, user: { id:user.id, email:user.email, role:user.role, tenantId:user.tenantId, tenantName:user.tenant.name } });
  } catch (e) { next(e); }
};

exports.me = (req, res) => res.json({ user: req.user });

exports.listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.user.tenantId },
      select: { id:true, email:true, role:true, createdAt:true, tenantId:true }
    });
    res.json({ data: users });
  } catch(e){ next(e); }
};

exports.createUser = async (req, res, next) => {
  try {
    const exists = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (exists) return next(new Conflict('User already exists'));
    const passwordHash = bcrypt.hashSync(String(req.body.password), 10);

    const tenantId = req.body.tenantId || req.user.tenantId;
    const tenantName = req.body.tenantName;

    if (req.body.tenantId && tenantName) {
      await prisma.tenant.upsert({ where:{ id: tenantId }, update:{ name: tenantName }, create:{ id: tenantId, name: tenantName } });
    }

    const created = await prisma.user.create({
      data: { email: req.body.email, passwordHash, role: req.body.role, tenantId },
      select: { id:true, email:true, role:true, tenantId:true, createdAt:true }
    });

    await writeAudit({ tenantId, userId: req.user.sub, type:'users.create', data:{ createdUserId: created.id } });
    res.status(201).json(created);
  } catch(e){ next(e); }
};
