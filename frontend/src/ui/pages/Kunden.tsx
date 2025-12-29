import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Kunden(){
  const [data,setData]=useState<any[]>([]);
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [telefon,setTelefon]=useState('');
  const [err,setErr]=useState<string|null>(null);

  async function refresh(){
    setErr(null);
    try { const r = await api.kunden.list(); setData(r.data); }
    catch(e:any){ setErr(e.message); }
  }

  useEffect(()=>{ refresh(); },[]);

  return (
    <div>
      <h1 style={{ marginTop:0 }}>Kunden</h1>
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, marginBottom:12 }}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Telefon" value={telefon} onChange={e=>setTelefon(e.target.value)} />
        <button onClick={async()=>{
          await api.kunden.create({ name, email: email||undefined, telefon: telefon||undefined });
          setName(''); setEmail(''); setTelefon(''); await refresh();
        }}>Anlegen</button>
      </div>

      <table width="100%" cellPadding={8} style={{ borderCollapse:'collapse' }}>
        <thead><tr style={{ textAlign:'left' }}><th>ID</th><th>Name</th><th>Email</th><th>Telefon</th></tr></thead>
        <tbody>
          {data.map(k => (
            <tr key={k.id} style={{ borderTop:'1px solid #eee' }}>
              <td>{k.id}</td><td>{k.name}</td><td>{k.email||''}</td><td>{k.telefon||''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
