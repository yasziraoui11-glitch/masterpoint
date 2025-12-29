const config = require('../config');
const { prisma } = require('../db/prisma');
const { addMinutesToHHMM, minutesSinceMidnight, todayISO } = require('../utils/time');
const { hhmmWindowOverlap } = require('../utils/overlap');
const { BadRequest, Conflict } = require('../utils/errors');

async function computeEndzeit(tenantId, termin) {
  if (termin.endzeit) return termin.endzeit;
  if (!termin.zeit || !termin.serviceId) return null;
  const s = await prisma.service.findFirst({ where: { tenantId, id: termin.serviceId } });
  if (!s) return null;
  return addMinutesToHHMM(termin.zeit, Number(s.dauerMinuten));
}

async function enforceBusinessRules(tenantId, candidate, ignoreId=null) {
  if (candidate.datum && candidate.datum < todayISO()) throw new BadRequest('Datum liegt in der Vergangenheit');

  const endHHMM = candidate.endzeit || await computeEndzeit(tenantId, candidate);
  const start = minutesSinceMidnight(candidate.zeit);
  const end = minutesSinceMidnight(endHHMM);
  const openS = minutesSinceMidnight(config.business.openingStart);
  const openE = minutesSinceMidnight(config.business.openingEnd);

  if ([start,end,openS,openE].some(v=>v===null)) throw new BadRequest('Ungültige Zeitangaben');
  if (!(start >= openS && end <= openE)) throw new BadRequest('Termin liegt außerhalb der Öffnungszeiten');

  const sameDay = await prisma.termin.findMany({
    where: { tenantId, datum: candidate.datum, NOT: ignoreId ? { id: ignoreId } : undefined },
    select: { id:true, zeit:true, endzeit:true, serviceId:true }
  });

  for (const t of sameDay) {
    const tEnd = t.endzeit || await computeEndzeit(tenantId, t);
    if (!t.zeit || !tEnd) continue;
    if (hhmmWindowOverlap(candidate.zeit, endHHMM, t.zeit, tEnd)) throw new Conflict('Terminkonflikt (Zeitfenster überschneidet sich)');
  }

  const gap = Number(config.business.minGapMinutes || 0);
  if (gap > 0) {
    const candEnd = end;
    for (const t of sameDay) {
      const tEnd = minutesSinceMidnight(t.endzeit || await computeEndzeit(tenantId, t));
      const tStart = minutesSinceMidnight(t.zeit);
      if ([tStart,tEnd,candEnd].some(v=>v===null)) continue;
      if (Math.abs(start - tEnd) < gap || Math.abs(tStart - candEnd) < gap) throw new Conflict('Mindestabstand zwischen Terminen verletzt');
    }
  }

  return endHHMM;
}

module.exports = { computeEndzeit, enforceBusinessRules };
