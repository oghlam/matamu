import { useState, useEffect, useRef } from 'react'
import { FileText, MapPin, LogOut, ShieldCheck, AlertCircle, Clock } from 'lucide-react'
import { useObservations } from '../../hooks/useObservations'
import Badge, { statusVariant, severityVariant } from '../../components/ui/Badge'
import DefectIcon from '../../components/ui/DefectIcon'
import ShareButtons from '../../components/ui/ShareButtons'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { getSession, clearSession, renderGoogleButton, devLogin, GOOGLE_CLIENT_ID } from '../../lib/auth'
import { photoUrl } from '../../lib/api'

const STATUS_LABELS = {
  published: 'Published',
  pending: 'Pending',
  pending_verification: 'Needs Review',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371
  const dLa = ((bLat - aLat) * Math.PI) / 180
  const dLo = ((bLng - aLng) * Math.PI) / 180
  const s = Math.sin(dLa / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLo / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export default function MyReports() {
  const [session, setSession] = useState(() => getSession())
  const [loginError, setLoginError] = useState(null)
  const gbtnRef = useRef(null)

  useEffect(() => {
    if (!session && gbtnRef.current && GOOGLE_CLIENT_ID) {
      gbtnRef.current.innerHTML = ''
      renderGoogleButton(gbtnRef.current, setSession, setLoginError)
    }
  }, [session])

  async function handleDevLogin() {
    setLoginError(null)
    try {
      setSession(await devLogin())
    } catch (err) {
      setLoginError(err)
    }
  }

  function logout() {
    clearSession()
    setSession(null)
  }

  // Hanya laporan milik reporter yang login (filter reporter_sub via id_token)
  const { data, loading, error, reload } = useObservations(
    session ? { id_token: session.id_token } : {},
    { skip: !session }
  )
  // All published for cluster count (multiplexer — viral = priority)
  const { data: allPublished } = useObservations({ status: 'published' })

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 pb-24 md:pb-6">
        <div className="w-16 h-16 rounded-2xl bg-surface shadow-card flex items-center justify-center">
          <ShieldCheck size={32} className="text-text-secondary" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-text-primary">View My Reports</h1>
          <p className="text-sm text-text-secondary max-w-xs">
            Sign in with your Google account to view your reports.
          </p>
        </div>
        {GOOGLE_CLIENT_ID ? (
          <div ref={gbtnRef} className="min-h-[44px]" />
        ) : (
          <button onClick={handleDevLogin} className="px-6 py-3 rounded-xl bg-dark text-white font-semibold text-sm">
            Sign in (Dev Mode)
          </button>
        )}
        {loginError && (
          <div className="flex items-center gap-2 text-sm text-danger bg-danger/5 px-3 py-2 rounded-lg max-w-xs">
            <AlertCircle size={14} />
            <span>{loginError.message}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-4 py-3 bg-surface border-b border-line shrink-0 flex items-center gap-2">
        <h1 className="text-base font-semibold text-text-primary">My Reports</h1>
        <span className="text-xs text-text-muted truncate max-w-[140px]">{session.name || session.email}</span>
        <button onClick={logout} aria-label="Sign out" className="ml-auto text-text-secondary">
          <LogOut size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 md:pb-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <ErrorState message="Failed to load reports" onRetry={reload} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Photograph road damage around you and submit a report."
          />
        ) : (
          data.map(obs => {
            // cluster count: same class within 50m among all published (multiplexer viral)
            const cluster = (allPublished || []).filter(v => (v.damage_class ?? v.class) === (obs.damage_class ?? obs.class) && v.lat != null && obs.lat != null && haversineKm(obs.lat, obs.lng, v.lat, v.lng) <= 0.05)
            const count = cluster.length || 1
            const topTrust = cluster.length ? Math.max(...cluster.map(v => v.trust_score ?? 0)) : (obs.trust_score ?? 0)
            const first = cluster.length ? cluster.reduce((min, v) => {
              const t = v.timestamp ?? v.created_at
              if (!t) return min
              return !min || new Date(t) < new Date(min) ? t : min
            }, null) : (obs.timestamp ?? obs.created_at)
            return <ReportCard key={obs.id} obs={obs} clusterCount={count} topTrust={topTrust} firstTime={first} />
          })
        )}
      </div>
    </div>
  )
}

function ReportCard({ obs, clusterCount = 1, topTrust, firstTime }) {
  const date = obs.timestamp
    ? new Date(obs.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const firstLabel = firstTime ? new Date(firstTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : date
  const isPending = obs.status === 'pending_verification' || obs.status === 'pending'
  const isViral = clusterCount >= 3
  // mock:// URLs (old dev data) are not loadable — show placeholder instead
  const hasPhoto = !!obs.evidence_url && !obs.evidence_url.startsWith('mock://')

  // Shorten address: extract street + area only (before first comma or max 50 chars)
  const shortLocation = (() => {
    if (!obs.location_label) return 'Unknown location'
    const label = obs.location_label
    // Try to get first 2 parts (street + area)
    const parts = label.split(',').map(p => p.trim())
    if (parts.length >= 2) {
      const short = `${parts[0]}, ${parts[1]}`
      return short.length > 60 ? short.substring(0, 57) + '...' : short
    }
    // Fallback: truncate at 50 chars
    return label.length > 50 ? label.substring(0, 47) + '...' : label
  })()

  return (
    <div className="bg-surface rounded-xl shadow-card overflow-hidden">
      {/* Top section: Photo + Info */}
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        {hasPhoto ? (
          <img
            src={photoUrl(obs.evidence_url)}
            alt="Report photo"
            className="w-20 h-20 rounded-lg object-cover shrink-0 bg-surface-2"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
            <FileText size={24} className="text-text-muted" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Location + Status */}
          <div className="space-y-1">
            <p className="text-sm font-bold text-text-primary leading-tight line-clamp-2">
              {shortLocation}
            </p>
            <Badge variant={statusVariant[obs.status] ?? 'muted'}>
              {STATUS_LABELS[obs.status] ?? obs.status}
            </Badge>
          </div>

          {/* Defect info */}
          <div className="flex items-center gap-2 text-xs">
            <DefectIcon type={obs.damage_class} size={18} />
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span className="font-semibold text-text-primary capitalize">
                {(obs.damage_class ?? 'Detected').replace(/_/g, ' ')}
              </span>
              {obs.severity && (
                <Badge variant={severityVariant[obs.severity] ?? 'muted'} dot={false}>
                  {obs.severity}
                </Badge>
              )}
            </div>
          </div>

          {/* Trust score */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">Trust</span>
            <span className="text-sm font-bold text-accent">{Math.round((obs.trust_score ?? 0) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Stats row - viral cluster */}
      <div className={`px-3 py-2 text-[11px] flex items-center flex-wrap gap-x-2 gap-y-1 border-t ${isViral ? 'bg-accent/10 border-accent/20' : 'bg-surface-2 border-line'}`}>
        <span className={isViral ? 'font-bold text-accent' : 'text-text-secondary'}>
          {clusterCount}× at spot
        </span>
        <span className="text-text-muted">•</span>
        <span className="text-text-secondary">
          top {Math.round((topTrust ?? obs.trust_score ?? 0) * 100)}%
        </span>
        <span className="text-text-muted">•</span>
        <span className="text-text-secondary">first {firstLabel}</span>
        {isViral && (
          <span className="ml-auto text-[10px] font-bold bg-accent text-dark px-2 py-0.5 rounded-full">
            🔥 Viral
          </span>
        )}
      </div>

      {/* Note (if exists) */}
      {obs.note && (
        <div className="px-3 py-2 bg-accent/5 border-t border-accent/10">
          <p className="text-[11px] text-text-primary italic line-clamp-2">
            <span className="font-semibold not-italic">Note:</span> {obs.note}
          </p>
        </div>
      )}

      {/* Pending reason */}
      {isPending && obs.review_reason && (
        <div className="px-3 py-2 bg-warning/10 border-t border-warning/20 flex items-start gap-2">
          <Clock size={12} className="shrink-0 mt-0.5 text-warning" />
          <p className="text-[11px] text-warning font-medium">
            {obs.review_reason}
          </p>
        </div>
      )}

      {/* Bottom: Date + Coords + Share */}
      <div className="px-3 py-2 border-t border-line bg-surface-2/50 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-text-muted">
          <span className="font-medium">{date}</span>
          {obs.lat && (
            <span className="flex items-center gap-1">
              <MapPin size={10} />
              {obs.lat.toFixed(4)}, {obs.lng.toFixed(4)}
            </span>
          )}
        </div>
        <div className="shrink-0">
          <ShareButtons
            compact
            title={`${obs.location_label ?? 'Road damage'} — ${obs.damage_class ?? ''}`}
            path={`/r/${obs.id}`}
          />
        </div>
      </div>
    </div>
  )
}
