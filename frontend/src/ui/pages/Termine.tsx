import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Termine(){
  const [rows,setRows]=useState<any[]>([]);
  const [datum,setDatum]=useState('');
  const [zeit,setZeit]=useState('');
  const [err,setErr]=useState<string|null>(null);

  async function refresh(){
    setErr(null);
    try { const r:any = await api.termine.list(); setRows(r.data || []); }
    catch(e:any){ setErr(e.message); }
  }

  useEffect(()=>{ refresh(); },[]);

  return (
    <div>
      <h1 style={{ marginTop:0 }}>Termine</h1>
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:12 }}>
        <input placeholder="Datum (YYYY-MM-DD)" value={datum} onChange={e=>setDatum(e.target.value)} />
        <input placeholder="Zeit (HH:MM)" value={zeit} onChange={e=>setZeit(e.target.value)} />
        <button onClick={async()=>{
          await api.termine.create({ datum, zeit });
          setDatum(''); setZeit('');
          await refresh();
        }}>Anlegen</button>
      </div>

      <table width="100%" cellPadding={8} style={{ borderCollapse:'collapse' }}>
        <thead><tr style={{ textAlign:'left' }}><th>ID</th><th>Datum</th><th>Zeit</th><th>Endzeit</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map(t => (
            <tr key={t.id} style={{ borderTop:'1px solid #eee' }}>
              <td>{t.id}</td><td>{t.datum}</td><td>{t.zeit}</td><td>{t.endzeit||''}</td><td>{t.status}</td>
              <td><button disabled={t.status!=='planned'} onClick={async()=>{ await api.termine.confirm(t.id); await refresh(); }}>Confirm</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
