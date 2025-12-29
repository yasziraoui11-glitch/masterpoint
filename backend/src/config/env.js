const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.string().default('production'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(24),
  JWT_EXPIRES_IN: z.string().default('12h'),

  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(8).optional(),
  INITIAL_TENANT_ID: z.string().min(1).default('t_default'),
  INITIAL_TENANT_NAME: z.string().min(1).default('Default Tenant'),

  OPENING_HOURS_START: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('08:00'),
  OPENING_HOURS_END: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('20:00'),
  MIN_GAP_MINUTES: z.coerce.number().int().nonnegative().default(0),

  AUTOMATIONS_ENABLED: z.string().default('true'),
  REMINDER_CRON: z.string().default('*/5 * * * *'),
  REMINDER_LEAD_MINUTES: z.coerce.number().int().positive().default(60),
  NO_SHOW_CRON: z.string().default('*/10 * * * *'),
  NO_SHOW_GRACE_MINUTES: z.coerce.number().int().positive().default(30),
});

function loadEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid env: ${msg}`);
  }
  const e = parsed.data;
  return {
    env: e.NODE_ENV,
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    jwt: { secret: e.JWT_SECRET, expiresIn: e.JWT_EXPIRES_IN },
    bootstrap: {
      email: e.INITIAL_ADMIN_EMAIL,
      password: e.INITIAL_ADMIN_PASSWORD,
      tenantId: e.INITIAL_TENANT_ID,
      tenantName: e.INITIAL_TENANT_NAME,
    },
    business: {
      openingStart: e.OPENING_HOURS_START,
      openingEnd: e.OPENING_HOURS_END,
      minGapMinutes: e.MIN_GAP_MINUTES,
    },
    automations: {
      enabled: String(e.AUTOMATIONS_ENABLED).toLowerCase()==='true',
      reminderCron: e.REMINDER_CRON,
      reminderLeadMinutes: e.REMINDER_LEAD_MINUTES,
      noShowCron: e.NO_SHOW_CRON,
      noShowGraceMinutes: e.NO_SHOW_GRACE_MINUTES,
    },
  };
}

module.exports = { loadEnv };
