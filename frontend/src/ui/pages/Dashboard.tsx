import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Dashboard(){
  const [me,setMe]=useState<any>(null);
  const [ready,setReady]=useState<any>(null);
  useEffect(()=>{
    api.me().then(setMe).catch(()=>{});
    api.ready().then(setReady).catch(()=>setReady({ok:false}));
  },[]);
  return (
    <div>
      <h1 style={{ marginTop:0 }}>Dashboard</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <pre style={{ background:'#fafafa', padding:12, border:'1px solid #eee', borderRadius:8 }}>{JSON.stringify(me,null,2)}</pre>
        <pre style={{ background:'#fafafa', padding:12, border:'1px solid #eee', borderRadius:8 }}>{JSON.stringify(ready,null,2)}</pre>
      </div>
    </div>
  );
}
