import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../../lib/api';

export default function Login(){
  const nav = useNavigate();
  const [email,setEmail]=useState('admin@example.com');
  const [password,setPassword]=useState('ChangeMe123!');
  const [err,setErr]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  return (
    <div style={{ maxWidth:420, margin:'10vh auto', padding:24, border:'1px solid #eee', borderRadius:12 }}>
      <h2 style={{ marginTop:0 }}>Login</h2>
      <div style={{ display:'grid', gap:10 }}>
        <label>Email<br/><input value={email} onChange={e=>setEmail(e.target.value)} style={{ width:'100%' }} /></label>
        <label>Passwort<br/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width:'100%' }} /></label>
        {err && <div style={{ color:'crimson' }}>{err}</div>}
        <button disabled={loading} onClick={async()=>{
          setLoading(true); setErr(null);
          try { const r = await api.login(email,password); setToken(r.token); nav('/app'); }
          catch(e:any){ setErr(e.message || 'Login failed'); }
          finally{ setLoading(false); }
        }}>Login</button>
      </div>
    </div>
  );
}
