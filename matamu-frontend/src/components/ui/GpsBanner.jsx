import { MapPin, MapPinOff, RefreshCw } from 'lucide-react'

// Persistent GPS status banner. Always visible so the user knows
// whether location is active — a report requires GPS.
export default function GpsBanner({ gps, compact = false }) {
  const { status, accuracy, message, retry } = gps

  if (status === 'on') {
    return (
      <div className="flex items-center gap-2 text-xs bg-success/10 text-success rounded-lg px-3 py-2">
        <MapPin size={14} className="shrink-0" />
        <span>
          GPS active
          {accuracy != null && <span className="opacity-80"> (±{Math.round(accuracy)}m)</span>}
        </span>
      </div>
    )
  }

  if (status === 'searching') {
    return (
      <div className="flex items-center gap-2 text-xs bg-surface-2 text-text-secondary rounded-lg px-3 py-2">
        <span className="w-3.5 h-3.5 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin shrink-0" />
        <span>Searching for GPS signal…</span>
      </div>
    )
  }

  // off / unsupported
  return (
    <div className="flex items-start gap-2 text-xs bg-danger/10 text-danger rounded-lg px-3 py-2">
      <MapPinOff size={14} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">GPS required — location is off</p>
        {!compact && message && <p className="opacity-90 mt-0.5 break-words">{message}</p>}
      </div>
      <button
        onClick={retry}
        className="shrink-0 flex items-center gap-1 font-semibold underline underline-offset-2"
      >
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  )
}
