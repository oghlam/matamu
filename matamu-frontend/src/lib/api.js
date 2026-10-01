// lib/api.js — thin fetch wrapper, base URL from env or relative
const BASE = import.meta.env.VITE_API_URL ?? ''

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = { get, post }

// Resolve evidence photo URL: absolute/http + mock pass through,
// relative /media/... prefixed with API base so split-domain
// deploys (PWA ≠ API host) still load. Same-origin dev: BASE='' → unchanged.
export function photoUrl(url) {
  if (!url || url.startsWith('http') || url.startsWith('mock://') || url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('/')) return `${BASE}${url}`
  return `${BASE}/${url}`
}
