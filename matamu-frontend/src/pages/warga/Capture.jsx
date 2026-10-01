import { useState, useRef, useEffect } from 'react'
import exifr from 'exifr'
import { Camera, Send, X, CheckCircle2, AlertCircle, Clock, LogOut, ShieldCheck, ImagePlus, Video, MapPin, MapPinOff } from 'lucide-react'
import { useGps } from '../../hooks/useGps'
import GpsBanner from '../../components/ui/GpsBanner'
import LiveCamera from '../../components/camera/LiveCamera'
import { getSession, clearSession, renderGoogleButton, devLogin, GOOGLE_CLIENT_ID } from '../../lib/auth'

// Claim location prefers photo EXIF (gallery) so reports can be filed later
// from home. Live GPS is fallback when the photo carries no EXIF.

const STATES = {
  idle: 'idle',
  preview: 'preview',
  submitting: 'submitting',
  success: 'success',
  error: 'error',
}

export default function Capture() {
  const [session, setSession] = useState(() => getSession())
  const [loginError, setLoginError] = useState(null)
  const [autoLogging, setAutoLogging] = useState(false)
  const [state, setState] = useState(STATES.idle)
  const [photo, setPhoto] = useState(null)   // { file, url }
  const [claim, setClaim] = useState(null) // { lat, lng, source: 'exif' } or null = use live GPS
  const [note, setNote] = useState('') // free text small note
  const [submitError, setSubmitError] = useState(null)
  const [result, setResult] = useState(null) // { status, trust_score, review_reason, ... }
  const [cameraMode, setCameraMode] = useState(false)
  const inputRef = useRef(null)
  const gbtnRef = useRef(null)

  // Continuous GPS watch — always on while on this page
  const gps = useGps()
  const gpsRef = useRef(gps)
  gpsRef.current = gps

  // Demo: auto dev-login when no GOOGLE_CLIENT_ID (or PWA standalone) — no login page flicker
  useEffect(() => {
    if (!session && !GOOGLE_CLIENT_ID) {
      let cancelled = false
      setAutoLogging(true)
      devLogin().then(s => { if (!cancelled) { setSession(s); setAutoLogging(false) } }).catch(err => { if (!cancelled) { setLoginError(err); setAutoLogging(false) } })
      return () => { cancelled = true }
    }
    // also auto-bypass when installed as PWA (standalone) even if client ID exists — demo convenience
    if (!session && window.matchMedia?.('(display-mode: standalone)').matches) {
      let cancelled = false
      setAutoLogging(true)
      devLogin().then(s => { if (!cancelled) { setSession(s); setAutoLogging(false) } }).catch(() => { if (!cancelled) setAutoLogging(false) })
      return () => { cancelled = true }
    }
  }, [session])

  // Render Google button when logged out (real auth mode)
  useEffect(() => {
    if (!session && gbtnRef.current && GOOGLE_CLIENT_ID && !autoLogging) {
      gbtnRef.current.innerHTML = ''
      renderGoogleButton(gbtnRef.current, setSession, setLoginError)
    }
  }, [session, autoLogging])

  function logout() {
    clearSession()
    setSession(null)
    reset()
  }

  async function handleDevLogin() {
    setLoginError(null)
    try {
      setSession(await devLogin())
    } catch (err) {
      setLoginError(err)
    }
  }

  async function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    // Gallery upload: prefer EXIF GPS as claim location (photo taken on the
    // road, report filed later from home). Live GPS is only a sanity hint.
    try {
      const exifGps = await exifr.gps(file).catch(() => null)
      // Corrupt GPS tags parse to NaN (NaN != null is true!) — require finite.
      if (Number.isFinite(exifGps?.latitude) && Number.isFinite(exifGps?.longitude)) {
        setClaim({ lat: exifGps.latitude, lng: exifGps.longitude, source: 'exif' })
        setSubmitError(null)
        setPhoto({ file, url: URL.createObjectURL(file) })
        setState(STATES.preview)
        return
      }
    } catch {
      // EXIF unreadable → fall through to live GPS
    }
    // No EXIF in photo → fall back to live GPS (must report on-site).
    setClaim(null)
    setPhoto({ file, url: URL.createObjectURL(file) })
    setState(STATES.preview)
  }

  function onCameraCapture(file) {
    setCameraMode(false)
    setClaim(null) // canvas snapshot has no EXIF → live GPS
    setPhoto({ file, url: URL.createObjectURL(file) })
    setState(STATES.preview)
  }

  function reset() {
    if (photo?.url) URL.revokeObjectURL(photo.url)
    setPhoto(null)
    setClaim(null)
    setNote('')
    setSubmitError(null)
    setResult(null)
    setState(STATES.idle)
  }

  async function submit() {
    // EXIF claim → report from anywhere (e.g. home). Live fallback → GPS required.
    const useExif = claim?.source === 'exif'
    const lat = useExif ? claim.lat : gps.lat
    const lng = useExif ? claim.lng : gps.lng
    if (!useExif && !gps.gpsOn) {
      setSubmitError('GPS is required. Turn on location before submitting.')
      setState(STATES.error)
      return
    }
    if (lat == null || lng == null) {
      setSubmitError('No location available for this photo.')
      setState(STATES.error)
      return
    }
    setState(STATES.submitting)
    setSubmitError(null)
    try {
      const form = new FormData()
      form.append('file', photo.file)
      const q = new URLSearchParams({
        lat,
        lng,
        ...(!useExif && gps.accuracy != null && { gps_accuracy: gps.accuracy }),
        ...(note.trim() && { note: note.trim() }),
        id_token: session.id_token,
      }).toString()
      const r = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/v1/capture?${q}`, {
        method: 'POST',
        body: form,
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || r.statusText)
      setResult(data)
      setState(STATES.success)
    } catch (err) {
      // Expired token → force re-login
      if (/sign in|token|401/i.test(err.message)) {
        clearSession()
        setSession(null)
      }
      setSubmitError(err.message)
      setState(STATES.error)
    }
  }

  // ── Not logged in ──
  if (!session) {
    if (autoLogging) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 pb-24">
          <span className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Preparing demo session…</p>
        </div>
      )
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-4 pb-24">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
          <ShieldCheck size={32} className="text-accent" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-2 px-4">
          <h1 className="text-xl font-bold text-text-primary">Welcome to Mat(a)Mu</h1>
          <p className="text-sm text-text-secondary">
            Report road damage and help keep our streets safe.
          </p>
        </div>
        <div className="w-full max-w-xs px-4">
          {GOOGLE_CLIENT_ID ? (
            <div ref={gbtnRef} className="min-h-[44px] flex justify-center" />
          ) : (
            <button
              onClick={handleDevLogin}
              className="w-full px-6 py-3 rounded-xl bg-dark text-white font-semibold text-sm active:scale-95 transition-transform"
            >
              Sign in (Dev Mode)
            </button>
          )}
        </div>
        {loginError && (
          <div className="flex items-start gap-2 text-sm text-danger bg-danger/5 border border-danger/20 px-3 py-2 rounded-lg mx-4">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{loginError.message}</span>
          </div>
        )}
        {!GOOGLE_CLIENT_ID && (
          <p className="text-[11px] text-text-muted text-center px-6">
            Dev mode (BYPASS_AUTH=1). Set VITE_GOOGLE_CLIENT_ID for real auth.
          </p>
        )}
      </div>
    )
  }

  // ── Success screen: Verified vs Pending + reason ──
  if (state === STATES.success && result) {
    const verified = result.status === 'published'
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-4 pb-24">
        <div className={[
          'w-20 h-20 rounded-2xl flex items-center justify-center',
          verified ? 'bg-success/15' : 'bg-warning/15',
        ].join(' ')}>
          {verified
            ? <CheckCircle2 size={40} className="text-success" strokeWidth={1.5} />
            : <Clock size={40} className="text-warning" strokeWidth={1.5} />}
        </div>
        <div className="text-center space-y-3 w-full px-4">
          <div className="space-y-1">
            <h2 className="font-bold text-text-primary text-lg">
              {verified ? 'Report Verified!' : 'Under Review'}
            </h2>
            <p className="text-sm text-text-secondary">
              {verified
                ? 'Published and visible to operators'
                : 'Being reviewed, will be published soon'}
            </p>
          </div>
          <div className="bg-surface rounded-xl px-4 py-3 border border-line">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Trust Score</span>
              <span className="font-bold text-text-primary text-lg">
                {Math.round((result.trust_score ?? 0) * 100)}%
              </span>
            </div>
          </div>
          {!verified && result.review_reason && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg px-3 py-2 text-left">
              <p className="text-xs font-semibold text-warning mb-1">Review Reason</p>
              <p className="text-xs text-text-secondary">{result.review_reason}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full px-4">
          <button
            onClick={reset}
            className="w-full px-6 py-3.5 rounded-xl bg-accent text-dark font-semibold text-sm active:scale-95 transition-transform shadow-card"
          >
            Report Another Issue
          </button>
          <button
            onClick={logout}
            aria-label="Sign out"
            className="w-full px-6 py-3 rounded-xl border-2 border-line text-text-secondary text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    )
  }

  // ── Preview + submit ──
  if (state === STATES.preview || state === STATES.submitting || state === STATES.error) {
    if (!photo) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 pb-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-danger" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-text-primary">Something went wrong</p>
            <p className="text-sm text-text-secondary">{submitError}</p>
          </div>
          <button
            onClick={() => { setSubmitError(null); setState(STATES.idle) }}
            className="px-6 py-3 rounded-xl bg-accent text-dark font-semibold text-sm active:scale-95 transition-transform"
          >
            Choose Another Photo
          </button>
        </div>
      )
    }
    const useExif = claim?.source === 'exif'
    const submitDisabled = state === STATES.submitting || (!useExif && !gps.gpsOn)
    return (
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
        <div className="flex-1 p-3 pb-24 space-y-2">
          {/* Compact user header */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold">
              {(session.name || session.email || '?')[0].toUpperCase()}
            </span>
            <span className="truncate text-text-secondary">{session.name || session.email}</span>
            <button onClick={logout} className="ml-auto text-text-secondary underline">Sign out</button>
          </div>

          {/* GPS status */}
          <GpsBanner gps={gps} />

          {/* Location badge - compact */}
          {useExif ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <p className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5">
                <MapPin size={12} className="shrink-0" />
                Photo GPS: {claim.lat.toFixed(5)}, {claim.lng.toFixed(5)}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                <MapPinOff size={12} className="shrink-0" />
                Using live GPS — must submit on-site
              </p>
            </div>
          )}

          {/* Photo preview - mobile optimized */}
          <div className="relative rounded-xl overflow-hidden bg-dark">
            <img src={photo.url} alt="Preview" className="w-full h-auto max-h-[35vh] object-contain" />
            <button
              onClick={reset}
              aria-label="Cancel"
              className="absolute top-2 right-2 w-9 h-9 rounded-full bg-dark/70 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <X size={18} />
            </button>
          </div>

          {/* Note input - compact */}
          <div className="bg-surface rounded-xl px-3 py-3 border border-line">
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Add note <span className="font-normal text-text-muted">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={500}
              placeholder="e.g., deep hole, flooded after rain"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
              rows={3}
            />
            <p className="text-[11px] text-text-muted text-right mt-1">{note.length}/500</p>
          </div>

          {submitError && (
            <div className="flex items-start gap-2 text-xs text-danger bg-danger/5 border border-danger/20 px-3 py-2 rounded-lg">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {!useExif && !gps.gpsOn && (
            <div className="bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
              <p className="text-[11px] text-danger text-center font-medium">
                GPS required to submit
              </p>
            </div>
          )}

          {/* Action buttons - sticky at bottom on mobile */}
          <div className="space-y-2 pt-2">
            <button
              onClick={submit}
              disabled={submitDisabled}
              className="w-full py-3.5 rounded-xl bg-accent text-dark font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-transform shadow-card"
            >
              {state === STATES.submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send size={16} /> Submit Report
                </>
              )}
            </button>
            <button
              onClick={reset}
              disabled={state === STATES.submitting}
              className="w-full py-3 rounded-xl border-2 border-line text-text-secondary font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-transform"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Idle: method picker (live camera vs upload) ──
  if (cameraMode) {
    return <LiveCamera onCapture={onCameraCapture} onCancel={() => setCameraMode(false)} />
  }
  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-4 pb-24">
        {/* User badge - compact */}
        <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2.5 border border-line shadow-card w-full max-w-sm">
          <span className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-sm shrink-0">
            {(session.name || session.email || '?')[0].toUpperCase()}
          </span>
          <span className="text-sm text-text-primary truncate flex-1">{session.name || session.email}</span>
          <button onClick={logout} className="text-xs text-text-secondary underline shrink-0">Sign out</button>
        </div>

        {/* GPS status */}
        <div className="w-full max-w-sm">
          <GpsBanner gps={gps} />
        </div>

        {/* Hero - compact */}
        <div className="text-center space-y-2 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-1">
            <Camera size={32} className="text-accent" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Report Road Damage</h1>
          <p className="text-sm text-text-secondary max-w-sm">
            Take a photo or choose from gallery. GPS is captured automatically.
          </p>
        </div>

        {/* Action cards - mobile optimized */}
        <div className="flex gap-3 w-full max-w-sm px-4">
          <button
            onClick={() => setCameraMode(true)}
            className="flex-1 rounded-2xl bg-dark text-white shadow-card active:scale-95 transition-transform p-6"
            aria-label="Take photo with camera"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Video size={24} strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Camera</p>
                <p className="text-xs text-white/70 mt-0.5">Take now</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => inputRef.current?.click()}
            className="flex-1 rounded-2xl bg-surface border-2 border-line shadow-card active:scale-95 transition-transform p-6"
            aria-label="Choose photo from gallery"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <ImagePlus size={24} strokeWidth={1.5} className="text-accent" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-text-primary">Gallery</p>
                <p className="text-xs text-text-secondary mt-0.5">Choose photo</p>
              </div>
            </div>
          </button>
        </div>

        {/* Helper - compact */}
        <div className="bg-surface-2 border border-line rounded-lg px-3 py-2 max-w-sm mx-4">
          <p className="text-[11px] text-text-secondary text-center">
            <span className="font-semibold text-text-primary">Tip:</span> Enable location in camera settings for delayed reports
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="sr-only"
          aria-label="Choose photo"
        />
      </div>
    </div>
  )
}
