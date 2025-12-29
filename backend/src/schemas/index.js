const { z } = require('zod');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const kundenCreate = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().transform(v => v ? String(v).toLowerCase() : v),
  telefon: z.string().optional().transform(v => v ? String(v).replace(/[\s\-()]/g,'') : v),
});
const kundenUpdate = kundenCreate.partial();

const serviceCreate = z.object({
  name: z.string().min(1),
  dauerMinuten: z.number().int().positive(),
  preis: z.number().nonnegative(),
  kategorie: z.string().optional(),
});
const serviceUpdate = serviceCreate.partial();

const terminCreate = z.object({
  datum: isoDate,
  zeit: hhmm,
  kundeId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  notiz: z.string().optional(),
});
const terminUpdate = terminCreate.partial();

const terminQuery = z.object({
  datum: isoDate.optional(),
  kundeId: z.string().optional(),
  serviceId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const login = z.object({
  email: z.string().email().transform(v => String(v).toLowerCase()),
  password: z.string().min(1),
});

const userCreate = z.object({
  email: z.string().email().transform(v => String(v).toLowerCase()),
  password: z.string().min(8),
  role: z.enum(['admin','mitarbeiter']),
  tenantId: z.string().min(1).optional(),
  tenantName: z.string().min(1).optional(),
});

module.exports = { kundenCreate, kundenUpdate, serviceCreate, serviceUpdate, terminCreate, terminUpdate, terminQuery, login, userCreate };
