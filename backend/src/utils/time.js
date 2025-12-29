function pad2(n){return String(n).padStart(2,'0');}
function parseHHMM(h){const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(h||'')); if(!m) return null; return {h:Number(m[1]),m:Number(m[2])};}
function minutesSinceMidnight(h){const p=parseHHMM(h); if(!p) return null; return p.h*60+p.m;}
function addMinutesToHHMM(h, d){const base=minutesSinceMidnight(h); if(base===null) return null; const total=base+Number(d||0); const hh=Math.floor(total/60); const mm=total%60; return `${pad2(hh)}:${pad2(mm)}`;}
function isISODate(d){return /^\d{4}-\d{2}-\d{2}$/.test(String(d||''));}
function todayISO(){const n=new Date(); return `${n.getFullYear()}-${pad2(n.getMonth()+1)}-${pad2(n.getDate())}`;}
module.exports={parseHHMM,minutesSinceMidnight,addMinutesToHHMM,isISODate,todayISO};
