// lib/auth.js — Google Sign-In (GIS) + session lokal untuk PWA warga.
const KEY = 'matamu_auth' // { id_token, sub, email, name }

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function saveSession(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function clearSession() {
  localStorage.removeItem(KEY)
}

let _gis = null
export function loadGIS() {
  if (_gis) return _gis
  _gis = new Promise((res, rej) => {
    if (window.google?.accounts?.id) return res()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = res
    s.onerror = () => rej(new Error('Failed to load Google Sign-In'))
    document.head.appendChild(s)
  })
  return _gis
}

/** Verifikasi ID token ke backend. Returns {sub,email,name}. */
export async function verifyWithBackend(idToken) {
  const r = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(e.error || 'Login gagal')
  }
  return r.json()
}

/** Render tombol Google ke elemen. onDone(profile) dipanggil setelah verifikasi backend OK. */
export async function renderGoogleButton(el, onDone, onError) {
  try {
    await loadGIS()
    if (!GOOGLE_CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID belum diset')
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (resp) => {
        try {
          const profile = await verifyWithBackend(resp.credential)
          saveSession({ id_token: resp.credential, ...profile })
          onDone({ id_token: resp.credential, ...profile })
        } catch (err) {
          onError?.(err)
        }
      },
      auto_select: false,
    })
    window.google.accounts.id.renderButton(el, {
      theme: 'filled_black', size: 'large', width: 280, text: 'signin_with', shape: 'pill',
    })
  } catch (err) {
    onError?.(err)
  }
}

/** Login dev-bypass (dipakai saat backend BYPASS_AUTH=1, tanpa Client ID). */
export async function devLogin() {
  const profile = await verifyWithBackend('dev')
  saveSession({ id_token: 'dev', ...profile })
  return { id_token: 'dev', ...profile }
}
