const { prisma } = require('../db/prisma');

async function writeAudit({ tenantId=null, userId=null, type, data=null }) {
  await prisma.auditEvent.create({ data: { tenantId, userId, type, data } });
}

module.exports = { writeAudit };
