import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kunden from './pages/Kunden';
import Termine from './pages/Termine';
import Reports from './pages/Reports';
import { getToken, clearToken } from '../lib/api';

function Protected({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  return (
    <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'100vh' }}>
      <aside style={{ padding:16, borderRight:'1px solid #eee' }}>
        <div style={{ fontWeight:700, marginBottom:12 }}>MASTERPOINT</div>
        <nav style={{ display:'grid', gap:8 }}>
          <Link to="/app">Dashboard</Link>
          <Link to="/app/kunden">Kunden</Link>
          <Link to="/app/termine">Termine</Link>
          <Link to="/app/reports">Reports</Link>
        </nav>
        <hr style={{ margin:'16px 0' }} />
        <button onClick={() => { clearToken(); nav('/login'); }} style={{ width:'100%' }}>Logout</button>
      </aside>
      <main style={{ padding:24 }}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<Protected><Layout><Dashboard /></Layout></Protected>} />
      <Route path="/app/kunden" element={<Protected><Layout><Kunden /></Layout></Protected>} />
      <Route path="/app/termine" element={<Protected><Layout><Termine /></Layout></Protected>} />
      <Route path="/app/reports" element={<Protected><Layout><Reports /></Layout></Protected>} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
