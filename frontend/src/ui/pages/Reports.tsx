import React, { useState } from 'react';
import { api } from '../../lib/api';

export default function Reports(){
  const [from,setFrom]=useState('');
  const [to,setTo]=useState('');
  const [out,setOut]=useState<any>(null);
  const [err,setErr]=useState<string|null>(null);

  return (
    <div>
      <h1 style={{ marginTop:0 }}>Reports</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:12 }}>
        <input placeholder="from (YYYY-MM-DD)" value={from} onChange={e=>setFrom(e.target.value)} />
        <input placeholder="to (YYYY-MM-DD)" value={to} onChange={e=>setTo(e.target.value)} />
        <button onClick={async()=>{
          setErr(null);
          try { setOut(await api.reports.umsatz(from||undefined, to||undefined)); }
          catch(e:any){ setErr(e.message); }
        }}>Umsatz</button>
      </div>
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      <pre style={{ background:'#fafafa', padding:12, border:'1px solid #eee', borderRadius:8 }}>{out?JSON.stringify(out,null,2):''}</pre>
    </div>
  );
}
