import { useState, useRef, useEffect } from 'react'
import exifr from 'exifr'
import { Camera, Send, X, CheckCircle2, AlertCircle, Clock, LogOut, ShieldCheck, ImagePlus, Video, MapPin, MapPinOff } from 'lucide-react'
import { useGps } from '../../hooks/useGps'
import GpsBanner from '../../components/ui/GpsBanner'
import LiveCamera from '../../components/camera/LiveCamera'
import LocationPicker from '../../components/location/LocationPicker'
import { getSession, clearSession, renderGoogleButton, devLogin, GOOGLE_CLIENT_ID } from '../../lib/auth'

// Apply GPS watermark badge to photo before submission
async function applyGpsWatermark(imageFile, lat, lng) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Prepare watermark text
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
      const gpsText = `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      const timeText = timestamp

      // Badge style
      const padding = 12
      const lineHeight = 20
      const fontSize = 14
      ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`

      // Measure text width
      const gpsWidth = ctx.measureText(gpsText).width
      const timeWidth = ctx.measureText(timeText).width
      const badgeWidth = Math.max(gpsWidth, timeWidth) + padding * 2
      const badgeHeight = lineHeight * 2 + padding * 2

      // Position: bottom-center with 12px margin
      const x = (canvas.width - badgeWidth) / 2
      const y = canvas.height - badgeHeight - 12

      // Draw badge background (dark semi-transparent)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
      // Manual rounded rectangle (roundRect not widely supported yet)
      const radius = 8
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + badgeWidth - radius, y)
      ctx.arcTo(x + badgeWidth, y, x + badgeWidth, y + radius, radius)
      ctx.lineTo(x + badgeWidth, y + badgeHeight - radius)
      ctx.arcTo(x + badgeWidth, y + badgeHeight, x + badgeWidth - radius, y + badgeHeight, radius)
      ctx.lineTo(x + radius, y + badgeHeight)
      ctx.arcTo(x, y + badgeHeight, x, y + badgeHeight - radius, radius)
      ctx.lineTo(x, y + radius)
      ctx.arcTo(x, y, x + radius, y, radius)
      ctx.closePath()
      ctx.fill()

      // Draw text (white)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(gpsText, x + padding, y + padding)
      ctx.fillText(timeText, x + padding, y + padding + lineHeight)

      // Convert to blob
      canvas.toBlob(blob => {
        if (blob) {
          resolve(new File([blob], imageFile.name, { type: 'image/jpeg' }))
        } else {
          reject(new Error('Canvas to blob conversion failed'))
        }
      }, 'image/jpeg', 0.92)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = URL.createObjectURL(imageFile)
  })
}

// Claim location prefers photo EXIF (gallery) so reports can be filed later
// from home. Live GPS is fallback when the photo carries no EXIF.
// Sidoarjo center is last resort when GPS is off (user must adjust pin).

const FALLBACK_CENTER = { lat: -7.447, lng: 112.718 }

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
  const [pinPosition, setPinPosition] = useState(null) // { lat, lng, source: 'exif'|'live'|'fallback', adjusted } — adjustable via mini map
  const [mapKey, setMapKey] = useState(0) // bump to remount LocationPicker on reset
  const [note, setNote] = useState('') // free text small note
  const [submitError, setSubmitError] = useState(null)
  const [result, setResult] = useState(null) // { status, trust_score, review_reason, ... }
  const [exifDebug, setExifDebug] = useState(null) // Debug info for EXIF reading
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

    // Claim location prefers photo EXIF (gallery) so reports can be filed
    // later from home. Live GPS is fallback when the photo carries no EXIF.
    const debugInfo = {
      file: `${file.name} (${(file.size / 1024).toFixed(1)}KB)`,
      type: file.type,
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
    }
    let exifLat = null
    let exifLng = null
    try {
      const exifGps = await exifr.gps(file).catch(err => {
        debugInfo.error = err.message
        return null
      })

      debugInfo.gpsResult = exifGps ? `lat=${exifGps.latitude?.toFixed(5)}, lng=${exifGps.longitude?.toFixed(5)}` : 'null'
      debugInfo.latFinite = Number.isFinite(exifGps?.latitude)
      debugInfo.lngFinite = Number.isFinite(exifGps?.longitude)

      if (Number.isFinite(exifGps?.latitude) && Number.isFinite(exifGps?.longitude)) {
        exifLat = exifGps.latitude
        exifLng = exifGps.longitude
        debugInfo.status = 'EXIF GPS detected (used as default pin)'
      } else {
        debugInfo.status = 'No GPS in EXIF (OS privacy protection)'
      }
      setExifDebug(debugInfo)
    } catch (err) {
      debugInfo.status = 'Exception: ' + err.message
      setExifDebug(debugInfo)
    }

    // Default pin: EXIF > live GPS > Sidoarjo fallback. User can adjust on mini map.
    const live = gpsRef.current
    if (exifLat != null && exifLng != null) {
      setPinPosition({ lat: exifLat, lng: exifLng, source: 'exif', adjusted: false })
    } else if (live.lat != null && live.lng != null) {
      setPinPosition({ lat: live.lat, lng: live.lng, source: 'live', adjusted: false })
    } else {
      setPinPosition({ lat: FALLBACK_CENTER.lat, lng: FALLBACK_CENTER.lng, source: 'fallback', adjusted: false })
    }
    setPhoto({ file, url: URL.createObjectURL(file) })
    setState(STATES.preview)
  }

  function onCameraCapture(file) {
    setCameraMode(false)
    // Canvas snapshot has no EXIF → live GPS, Sidoarjo fallback when GPS off
    const live = gpsRef.current
    if (live.lat != null && live.lng != null) {
      setPinPosition({ lat: live.lat, lng: live.lng, source: 'live', adjusted: false })
    } else {
      setPinPosition({ lat: FALLBACK_CENTER.lat, lng: FALLBACK_CENTER.lng, source: 'fallback', adjusted: false })
    }
    setPhoto({ file, url: URL.createObjectURL(file) })
    setState(STATES.preview)
  }

  function handlePinMove({ lat, lng }) {
    setPinPosition(prev => (prev ? { ...prev, lat, lng, adjusted: true } : { lat, lng, source: 'live', adjusted: true }))
  }

  function resetPinToCurrentGPS() {
    const live = gpsRef.current
    if (live.lat != null && live.lng != null) {
      setPinPosition({ lat: live.lat, lng: live.lng, source: 'live', adjusted: false })
      setMapKey(k => k + 1) // remount map centered on live GPS
    }
  }

  function reset() {
    if (photo?.url) URL.revokeObjectURL(photo.url)
    setPhoto(null)
    setPinPosition(null)
    setMapKey(0)
    setNote('')
    setSubmitError(null)
    setResult(null)
    setState(STATES.idle)
  }

  async function submit() {
    // Adjusted pin position (not live GPS directly). GPS stays required
    // per project policy — pin adjust only corrects an inaccurate fix.
    const lat = pinPosition?.lat
    const lng = pinPosition?.lng
    if (!gps.gpsOn) {
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
      // Apply GPS watermark badge before upload
      const watermarkedFile = await applyGpsWatermark(photo.file, lat, lng)

      const form = new FormData()
      form.append('file', watermarkedFile)
      const q = new URLSearchParams({
        lat,
        lng,
        ...(gps.accuracy != null && { gps_accuracy: gps.accuracy }),
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
    const submitDisabled = state === STATES.submitting || !gps.gpsOn
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

          {/* Adjustable report location */}
          <div className="bg-surface rounded-xl p-3 border border-line space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <MapPin size={14} className="shrink-0" />
                Adjust Report Location
              </label>
              {gps.gpsOn && (
                <button
                  onClick={resetPinToCurrentGPS}
                  className="text-xs text-accent underline active:opacity-70"
                >
                  Reset to GPS
                </button>
              )}
            </div>

            {pinPosition && (
              <LocationPicker
                key={mapKey}
                initialLat={pinPosition.lat}
                initialLng={pinPosition.lng}
                onChange={handlePinMove}
              />
            )}

            <p className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5 font-mono">
              <MapPin size={12} className="shrink-0" />
              {pinPosition ? `${pinPosition.lat.toFixed(6)}, ${pinPosition.lng.toFixed(6)}` : 'Locating…'}
              {pinPosition?.adjusted && <span className="font-sans font-normal text-text-muted">(adjusted)</span>}
            </p>
            <p className="text-[11px] text-text-muted">
              Drag the red pin or tap the map to place it where the photo was taken. This location is stamped on the photo watermark.
            </p>
          </div>

          {/* EXIF Debug Info (visible when exifDebug is set) */}
          {exifDebug && (
            <details className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[10px] font-mono">
              <summary className="font-bold text-blue-900 cursor-pointer">EXIF Debug Info (tap to expand)</summary>
              <div className="mt-2 space-y-1 text-blue-800">
                <div><strong>File:</strong> {exifDebug.file}</div>
                <div><strong>Type:</strong> {exifDebug.type}</div>
                <div><strong>Browser:</strong> {exifDebug.browser}</div>
                <div><strong>GPS Result:</strong> {exifDebug.gpsResult}</div>
                <div><strong>Finite Check:</strong> lat={exifDebug.latFinite?.toString()}, lng={exifDebug.lngFinite?.toString()}</div>
                <div><strong>Status:</strong> {exifDebug.status}</div>
                {exifDebug.error && <div className="text-red-700"><strong>Error:</strong> {exifDebug.error}</div>}
              </div>
            </details>
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

          {!gps.gpsOn && (
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
