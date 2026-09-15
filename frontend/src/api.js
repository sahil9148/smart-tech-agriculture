/* ═══════════════════════════════════════════════
   Smart AgriTech — API Service
   All backend calls go through this module.
   Base URL is set via VITE_API_URL environment var.
   ═══════════════════════════════════════════════ */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ── Token management ──────────────────────────
export const TokenStore = {
  get:    ()    => localStorage.getItem('agritech_token'),
  set:    (tok) => localStorage.setItem('agritech_token', tok),
  clear:  ()    => localStorage.removeItem('agritech_token'),
}

// ── Core fetch wrapper ────────────────────────
async function apiFetch(path, options = {}) {
  const token = TokenStore.get()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
    TokenStore.clear()
    window.location.reload()
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const msg = data.message || data.errors?.[0]?.msg || `Request failed (${res.status})`
    throw new Error(msg)
  }

  return data
}

// ── Auth ──────────────────────────────────────
export const Auth = {
  register: (body) => apiFetch('/api/auth/register', { method: 'POST', body }),
  login:    (body) => apiFetch('/api/auth/login',    { method: 'POST', body }),
  google:   (body) => apiFetch('/api/auth/google',   { method: 'POST', body }),
  me:       ()     => apiFetch('/api/auth/me'),
  updateProfile: (body) => apiFetch('/api/auth/profile',  { method: 'PUT', body }),
  changePassword: (body) => apiFetch('/api/auth/password', { method: 'PUT', body }),
}

// ── Dashboard ─────────────────────────────────
export const Dashboard = {
  stats:      ()     => apiFetch('/api/dashboard/stats'),
  activities: ()     => apiFetch('/api/dashboard/activities'),
  addActivity:(body) => apiFetch('/api/dashboard/activities', { method: 'POST', body }),
}

// ── Schemes ───────────────────────────────────
export const Schemes = {
  list:         (params = {}) => apiFetch('/api/schemes?' + new URLSearchParams(params)),
  applications: ()            => apiFetch('/api/schemes/applications'),
  apply:        (body)        => apiFetch('/api/schemes/apply', { method: 'POST', body }),
}

// ── Equipment ─────────────────────────────────
export const Equipment = {
  list:         (params = {}) => apiFetch('/api/equipment?' + new URLSearchParams(params)),
  applications: ()            => apiFetch('/api/equipment/applications'),
  apply:        (body)        => apiFetch('/api/equipment/apply', { method: 'POST', body }),
}

// ── Insurance ─────────────────────────────────
export const Insurance = {
  list:   ()     => apiFetch('/api/insurance'),
  enrol:  (body) => apiFetch('/api/insurance/enrol', { method: 'POST', body }),
  claim:  (id, body) => apiFetch(`/api/insurance/${id}/claim`, { method: 'POST', body }),
  remove: (id)   => apiFetch(`/api/insurance/${id}`, { method: 'DELETE' }),
}

// ── Market ────────────────────────────────────
export const Market = {
  list:       (params = {}) => apiFetch('/api/market?' + new URLSearchParams(params)),
  myListings: ()            => apiFetch('/api/market/my-listings'),
  msp:        ()            => apiFetch('/api/market/msp'),
  create:     (body)        => apiFetch('/api/market',     { method: 'POST', body }),
  update:     (id, body)    => apiFetch(`/api/market/${id}`, { method: 'PUT', body }),
  remove:     (id)          => apiFetch(`/api/market/${id}`, { method: 'DELETE' }),
  inquiry:    (id, body)    => apiFetch(`/api/market/${id}/inquiry`, { method: 'POST', body }),
}

// ── Weather ───────────────────────────────────
export const Weather = {
  get:      () => apiFetch('/api/weather'),
  advisory: () => apiFetch('/api/weather/advisory'),
}

// ── Chat ──────────────────────────────────────
export const Chat = {
  send:        (body) => apiFetch('/api/chat', { method: 'POST', body }),
  history:     ()     => apiFetch('/api/chat/history'),
  clearHistory:()     => apiFetch('/api/chat/history', { method: 'DELETE' }),
}

// ── Reports ───────────────────────────────────
export const Reports = {
  summary: () => apiFetch('/api/reports/summary'),
}

// ── Health ────────────────────────────────────
export const healthCheck = () => apiFetch('/api/health')
