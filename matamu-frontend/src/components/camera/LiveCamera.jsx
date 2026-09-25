import { useEffect, useRef, useState } from 'react'
import { X, Camera, ImagePlus } from 'lucide-react'

// Live camera with viewfinder (circle + crosshair) and scanline.
// onCapture(file) — JPEG snapshot. onCancel() — back to method picker.
export default function LiveCamera({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This device or browser does not support live camera. Use upload instead.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)
      } catch (err) {
        if (!cancelled) {
          setError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Allow camera access or use upload instead.'
              : 'Cannot start camera. Use upload instead.'
          )
        }
      }
    }
    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  function takePhoto() {
    const video = videoRef.current
    if (!video || !ready) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture(file)
    }, 'image/jpeg', 0.9)
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-danger font-medium max-w-xs">{error}</p>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl border border-line text-text-secondary font-medium text-sm flex items-center gap-2"
        >
          <ImagePlus size={16} /> Back to options
        </button>
      </div>
    )
  }

  // double-tap anywhere on viewfinder to capture (in addition to shutter button)
  const lastTapRef = useRef(0)
  function handleViewfinderTap() {
    const now = Date.now()
    if (now - lastTapRef.current < 300) takePhoto()
    lastTapRef.current = now
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-dark relative">
      {/* Viewfinder — double tap to capture */}
      <div className="flex-1 relative overflow-hidden min-h-0" onDoubleClick={takePhoto} onTouchEnd={handleViewfinderTap}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Scanline — full height sweep */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="scanline w-full h-12 bg-gradient-to-b from-transparent via-accent/40 to-transparent" />
        </div>
        {/* Viewfinder: circle + crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-56 h-56">
            <div className="absolute inset-0 rounded-full border-2 border-white/80" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 font-bold text-2xl leading-none select-none">+</div>
            {/* Corner ticks */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-[3px] border-l-[3px] border-accent rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-[3px] border-r-[3px] border-accent rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-[3px] border-l-[3px] border-accent rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-[3px] border-r-[3px] border-accent rounded-br-lg" />
          </div>
        </div>
        <p className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-white bg-dark/60 rounded-full px-3 py-1 whitespace-nowrap">
          Center the damage in the circle
        </p>
        {/* Cancel */}
        <button
          onClick={onCancel}
          aria-label="Cancel camera"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-dark/60 flex items-center justify-center text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Shutter bar — lifted above BottomNav, fully visible (double tap anywhere on viewfinder also captures) */}
      <div className="shrink-0 flex items-center justify-center gap-6 pt-5 pb-24 md:pb-5 bg-dark">
        <span className="text-[11px] text-white/60 w-16 text-right">
          {ready ? 'Ready • double tap to capture' : 'Starting…'}
        </span>
        <button
          onClick={takePhoto}
          disabled={!ready}
          aria-label="Take photo"
          className="w-[72px] h-[72px] rounded-full border-4 border-white/90 bg-white/10 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 shrink-0"
        >
          <span className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-dark">
            <Camera size={26} />
          </span>
        </button>
        <span className="w-16" />
      </div>
    </div>
  )
}
