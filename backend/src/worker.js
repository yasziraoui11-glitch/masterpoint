require('dotenv').config();

const cron = require('node-cron');
const config = require('./config');
const { prisma } = require('./db/prisma');
const { logger } = require('./middleware/logger');
const { writeAudit } = require('./utils/audit');
const { todayISO } = require('./utils/time');

async function runReminders() {
  const leadMs = Number(config.automations.reminderLeadMinutes || 60) * 60 * 1000;
  const now = Date.now();

  const tenants = await prisma.tenant.findMany({ select: { id:true } });

  for (const t of tenants) {
    const tenantId = t.id;

    const candidates = await prisma.termin.findMany({
      where: {
        tenantId,
        status: { in: ['planned','confirmed'] },
        reminderSentAt: null,
      },
      include: { kunde: true },
    });

    for (const termin of candidates) {
      if (!termin.kunde?.email) continue;
      const ms = new Date(`${termin.datum}T${termin.zeit}:00`).getTime();
      if (!Number.isFinite(ms)) continue;
      const delta = ms - now;
      if (delta <= 0 || delta > leadMs) continue;

      await prisma.termin.update({ where: { id: termin.id }, data: { reminderSentAt: new Date() } });
      await writeAudit({ tenantId, type:'automation.reminder_sent', data:{ terminId: termin.id } });
    }
  }
}

async function runNoShow() {
  const graceMs = Number(config.automations.noShowGraceMinutes || 30) * 60 * 1000;
  const now = Date.now();

  const tenants = await prisma.tenant.findMany({ select: { id:true } });

  for (const t of tenants) {
    const tenantId = t.id;
    const candidates = await prisma.termin.findMany({
      where: { tenantId, status: { in: ['planned','confirmed'] } },
      select: { id:true, datum:true, zeit:true, status:true }
    });

    for (const termin of candidates) {
      const ms = new Date(`${termin.datum}T${termin.zeit}:00`).getTime();
      if (!Number.isFinite(ms)) continue;
      if (now - ms < graceMs) continue;

      // re-check status (race-safe)
      const current = await prisma.termin.findUnique({ where: { id: termin.id }, select: { status:true } });
      if (!current || ['cancelled','completed','no_show'].includes(current.status)) continue;

      await prisma.termin.update({ where: { id: termin.id }, data: { status: 'no_show', noShowAt: new Date() } });
      await writeAudit({ tenantId, type:'automation.no_show', data:{ terminId: termin.id } });
    }
  }
}

async function main() {
  if (!config.automations.enabled) {
    logger.info('Worker started (automations disabled)');
    return;
  }

  logger.info('Worker started (automations enabled)');

  cron.schedule(config.automations.reminderCron, () => runReminders().catch(err => logger.error({ err }, 'Reminder job failed')));
  cron.schedule(config.automations.noShowCron, () => runNoShow().catch(err => logger.error({ err }, 'No-show job failed')));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
