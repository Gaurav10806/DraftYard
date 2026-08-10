// client/src/services/revivalApi.js
// Small fetch wrapper for the Revival Board page.
// No axios dependency needed — plain fetch keeps this drop-in ready.

const API_BASE = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`)
  : (import.meta.env.PROD ? 'https://draftyard-backend.onrender.com/api' : 'http://localhost:5000/api');

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

// GET projects that are open for revival, with optional filters
export async function getRevivalProjects({ stack = '', stage = '', domain = '' } = {}) {
  const params = new URLSearchParams();
  if (stack) params.set('stack', stack);
  if (stage) params.set('stage', stage);
  if (domain) params.set('domain', domain);

  const res = await fetch(`${API_BASE}/revival-board?${params.toString()}`);
  return handleResponse(res);
}

// PATCH raise a hand on a specific project
export async function raiseHand(projectId, { name, message = '', contact = '' }) {
  const res = await fetch(`${API_BASE}/draft/${projectId}/raise-hand`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, message, contact }),
  });
  return handleResponse(res);
}