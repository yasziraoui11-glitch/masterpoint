const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export function getToken(){ return localStorage.getItem('mp_token'); }
export function setToken(t:string){ localStorage.setItem('mp_token', t); }
export function clearToken(){ localStorage.removeItem('mp_token'); }

async function request<T>(path:string, init:RequestInit = {}): Promise<T> {
  const headers: Record<string,string> = { 'Content-Type':'application/json', ...(init.headers as any) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const b:any = await res.json(); if (b?.error) msg = b.error; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as any;
  return res.json();
}

export const api = {
  login: (email:string, password:string) => request<{token:string}>(`/auth/login`, { method:'POST', body: JSON.stringify({ email, password }) }),
  me: () => request(`/auth/me`),
  health: () => request(`/health`),
  ready: () => request(`/ready`),
  kunden: {
    list: () => request<{data:any[]}>(`/kunden`),
    create: (payload:any) => request(`/kunden`, { method:'POST', body: JSON.stringify(payload) }),
  },
  services: {
    list: () => request<{data:any[]}>(`/services`),
  },
  termine: {
    list: () => request<any>(`/termine`),
    create: (payload:any) => request(`/termine`, { method:'POST', body: JSON.stringify(payload) }),
    confirm: (id:string) => request(`/termine/${id}/confirm`, { method:'POST' }),
  },
  reports: {
    umsatz: (from?:string,to?:string) => request(`/reports/umsatz?from=${from||''}&to=${to||''}`),
  },
};
