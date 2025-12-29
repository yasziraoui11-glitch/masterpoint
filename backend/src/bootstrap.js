const bcrypt = require('bcryptjs');
const config = require('./config');
const { prisma } = require('./db/prisma');

async function bootstrapInitialAdmin() {
  // Ensure tenant exists
  await prisma.tenant.upsert({
    where: { id: config.bootstrap.tenantId },
    update: { name: config.bootstrap.tenantName },
    create: { id: config.bootstrap.tenantId, name: config.bootstrap.tenantName },
  });

  const anyUser = await prisma.user.count();
  if (anyUser > 0) return;

  if (!config.bootstrap.email || !config.bootstrap.password) return;

  const passwordHash = bcrypt.hashSync(String(config.bootstrap.password), 10);
  await prisma.user.create({
    data: {
      email: String(config.bootstrap.email).toLowerCase(),
      passwordHash,
      role: 'admin',
      tenantId: config.bootstrap.tenantId,
    },
  });
}

module.exports = { bootstrapInitialAdmin };
