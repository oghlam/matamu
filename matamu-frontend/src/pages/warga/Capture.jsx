import { useState, useRef, useEffect } from 'react'
import { Camera, Send, X, CheckCircle2, AlertCircle, Clock, LogOut, ShieldCheck, ImagePlus, Video } from 'lucide-react'
import { useGps } from '../../hooks/useGps'
import GpsBanner from '../../components/ui/GpsBanner'
import LiveCamera from '../../components/camera/LiveCamera'
import { getSession, clearSession, renderGoogleButton, devLogin, GOOGLE_CLIENT_ID } from '../../lib/auth'

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
  const [state, setState] = useState(STATES.idle)
  const [photo, setPhoto] = useState(null)   // { file, url }
  const [submitError, setSubmitError] = useState(null)
  const [result, setResult] = useState(null) // { status, trust_score, review_reason, ... }
  const [cameraMode, setCameraMode] = useState(false)
  const inputRef = useRef(null)
  const gbtnRef = useRef(null)

  // Continuous GPS watch — always on while on this page
  const gps = useGps()

  // Render Google button when logged out
  useEffect(() => {
    if (!session && gbtnRef.current && GOOGLE_CLIENT_ID) {
      gbtnRef.current.innerHTML = ''
      renderGoogleButton(gbtnRef.current, setSession, setLoginError)
    }
  }, [session])

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

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPhoto({ file, url: URL.createObjectURL(file) })
    setState(STATES.preview)
  }

  function onCameraCapture(file) {
    setCameraMode(false)
    setPhoto({ file, url: URL.createObjectURL(file) })
    setState(STATES.preview)
  }

  function reset() {
    if (photo?.url) URL.revokeObjectURL(photo.url)
    setPhoto(null)
    setSubmitError(null)
    setResult(null)
    setState(STATES.idle)
  }

  async function submit() {
    if (!gps.gpsOn) {
      setSubmitError('GPS is required. Turn on location before submitting.')
      setState(STATES.error)
      return
    }
    setState(STATES.submitting)
    setSubmitError(null)
    try {
      const form = new FormData()
      form.append('file', photo.file)
      const q = new URLSearchParams({
        lat: gps.lat,
        lng: gps.lng,
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
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 pb-24 md:pb-6">
        <div className="w-16 h-16 rounded-2xl bg-surface shadow-card flex items-center justify-center">
          <ShieldCheck size={32} className="text-text-secondary" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-text-primary">Sign in to report</h1>
          <p className="text-sm text-text-secondary max-w-xs">
            Sign in with your Google account so reports stay verified and abuse-free.
          </p>
        </div>
        {GOOGLE_CLIENT_ID ? (
          <div ref={gbtnRef} className="min-h-[44px]" />
        ) : (
          <button
            onClick={handleDevLogin}
            className="px-6 py-3 rounded-xl bg-dark text-white font-semibold text-sm"
          >
            Sign in (Dev Mode)
          </button>
        )}
        {loginError && (
          <div className="flex items-center gap-2 text-sm text-danger bg-danger/5 px-3 py-2 rounded-lg max-w-xs">
            <AlertCircle size={14} />
            <span>{loginError.message}</span>
          </div>
        )}
        {!GOOGLE_CLIENT_ID && (
          <p className="text-[11px] text-text-muted max-w-xs text-center">
            Dev mode is on (BYPASS_AUTH=1). Set VITE_GOOGLE_CLIENT_ID for real Google sign-in.
          </p>
        )}
      </div>
    )
  }

  // ── Success screen: Verified vs Pending + reason ──
  if (state === STATES.success && result) {
    const verified = result.status === 'published'
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 pb-24 md:pb-6">
        <div className={[
          'w-16 h-16 rounded-2xl flex items-center justify-center',
          verified ? 'bg-success/10' : 'bg-warning/10',
        ].join(' ')}>
          {verified
            ? <CheckCircle2 size={32} className="text-success" />
            : <Clock size={32} className="text-warning" />}
        </div>
        <div className="text-center space-y-1">
          <p className="font-semibold text-text-primary text-lg">
            {verified ? 'Verified — Report Accepted' : 'Pending — Awaiting Review'}
          </p>
          <p className="text-sm text-text-secondary">
            Trust score: {Math.round((result.trust_score ?? 0) * 100)}
          </p>
          {!verified && result.review_reason && (
            <p className="text-xs text-text-secondary bg-surface-2 rounded-lg px-3 py-2 mt-2 max-w-xs">
              Reason: {result.review_reason}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-accent text-dark font-semibold text-sm"
          >
            Report Again
          </button>
          <button
            onClick={logout}
            aria-label="Sign out"
            className="px-4 py-2.5 rounded-xl border border-line text-text-secondary text-sm flex items-center gap-1.5"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    )
  }

  // ── Preview + submit ──
  if (state === STATES.preview || state === STATES.submitting || state === STATES.error) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4 pb-24 md:pb-4">
        {/* Reporter identity */}
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold">
            {(session.name || session.email || '?')[0].toUpperCase()}
          </span>
          <span className="truncate">{session.name || session.email}</span>
          <button onClick={logout} className="ml-auto underline underline-offset-2">Sign out</button>
        </div>

        {/* Persistent GPS status — always visible */}
        <GpsBanner gps={gps} />

        {/* Photo preview */}
        <div className="relative rounded-xl overflow-hidden bg-surface-2 aspect-video max-h-64">
          <img src={photo.url} alt="Report preview" className="w-full h-full object-cover" />
          <button
            onClick={reset}
            aria-label="Cancel"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-dark/60 flex items-center justify-center text-white"
          >
            <X size={16} />
          </button>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 text-sm text-danger bg-danger/5 px-3 py-2 rounded-lg">
            <AlertCircle size={14} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-auto">
          <button
            onClick={reset}
            className="flex-1 py-3 rounded-xl border border-line text-text-secondary font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={state === STATES.submitting || !gps.gpsOn}
            title={!gps.gpsOn ? 'Turn on GPS to submit' : 'Save and submit report'}
            className="flex-1 py-3 rounded-xl bg-accent text-dark font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {state === STATES.submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Send size={16} /> Save Report
              </>
            )}
          </button>
        </div>
        {!gps.gpsOn && (
          <p className="text-[11px] text-text-muted text-center -mt-2">
            Submit is disabled until GPS is active.
          </p>
        )}
      </div>
    )
  }

  // ── Idle: method picker (live camera vs upload) ──
  if (cameraMode) {
    return <LiveCamera onCapture={onCameraCapture} onCancel={() => setCameraMode(false)} />
  }
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 pb-24 md:pb-6">
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold">
          {(session.name || session.email || '?')[0].toUpperCase()}
        </span>
        <span className="truncate max-w-[160px]">{session.name || session.email}</span>
        <button onClick={logout} className="underline underline-offset-2">Sign out</button>
      </div>

      <div className="w-full max-w-xs">
        <GpsBanner gps={gps} />
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-text-primary">Report Road Damage</h1>
        <p className="text-sm text-text-secondary">Take a photo, GPS is automatic, submit.</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setCameraMode(true)}
          className="w-28 h-28 rounded-2xl bg-dark text-white shadow-float flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
          aria-label="Use live camera"
        >
          <Video size={32} strokeWidth={1.5} />
          <span className="text-xs font-semibold">Camera</span>
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="w-28 h-28 rounded-2xl bg-surface shadow-card flex flex-col items-center justify-center gap-2 text-text-secondary hover:bg-surface-2 active:scale-95 transition-transform"
          aria-label="Upload photo"
        >
          <ImagePlus size={32} strokeWidth={1.5} />
          <span className="text-xs font-semibold">Upload</span>
        </button>
      </div>

      <p className="text-xs text-text-muted">Live camera or pick from gallery</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="sr-only"
        aria-label="Choose photo"
      />
    </div>
  )
}
