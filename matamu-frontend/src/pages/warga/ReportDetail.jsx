import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, ArrowLeft, Flame } from 'lucide-react'
import { api, photoUrl } from '../../lib/api'
import Badge, { severityVariant } from '../../components/ui/Badge'
import DefectIcon from '../../components/ui/DefectIcon'
import ShareButtons from '../../components/ui/ShareButtons'
import { SkeletonCard } from '../../components/ui/Skeleton'

const CLASS_LABELS = {
  pothole: 'Pothole',
  longitudinal_crack: 'Longitudinal Crack',
  alligator_crack: 'Alligator Crack',
  rutting: 'Rutting',
  flooding: 'Flooding',
  surface_degradation: 'Surface Degradation',
}

export default function ReportDetail() {
  const { id } = useParams()
  const [obs, setObs] = useState(null)
  const [error, setError] = useState(null)
  const [cluster, setCluster] = useState(null) // { count, topTrust, firstTime, notes }

  useEffect(() => {
    api.get(`/api/v1/observations/${id}`)
      .then(o => {
        setObs(o)
        // fetch nearby for multiplexer count (50m same class)
        if (o.lat != null && o.lng != null) {
          api.get(`/api/v1/observations/nearby?lat=${o.lat}&lng=${o.lng}&radius_m=50`)
            .then(list => {
              const sameClass = (Array.isArray(list) ? list : []).filter(v => (v.class ?? v.damage_class) === (o.class ?? o.damage_class))
              const count = sameClass.length || 1
              const topTrust = sameClass.length ? Math.max(...sameClass.map(v => v.trust_score ?? 0), o.trust_score ?? 0) : (o.trust_score ?? 0)
              // fetch full detail for firstTime? use nearby timestamps if available, fallback to obs
              const first = sameClass.reduce((min, v) => {
                const t = v.created_at ?? v.timestamp
                if (!t) return min
                return !min || new Date(t) < new Date(min) ? t : min
              }, o.created_at ?? o.timestamp)
              setCluster({ count, topTrust, firstTime: first, notes: sameClass.map(v => v.note).filter(Boolean) })
            })
            .catch(() => setCluster({ count: 1, topTrust: o.trust_score, firstTime: o.created_at ?? o.timestamp, notes: [] }))
        }
      })
      .catch(() => setError('Report not found'))
  }, [id])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-4 py-3 bg-surface border-b border-line shrink-0 flex items-center gap-2">
        <Link to="/" aria-label="Back to map" className="text-text-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-text-primary">Report #{id}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
        {!obs && !error && <SkeletonCard />}
        {error && <p className="text-sm text-danger font-medium text-center py-12">{error}</p>}
        {obs && (
          <div className="bg-surface rounded-xl shadow-card overflow-hidden">
            {obs.evidence_url && (
              <img src={photoUrl(obs.evidence_url)} alt="Damage photo" className="w-full max-h-72 object-cover" />
            )}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-text-primary break-words">
                  {obs.location ?? 'Location'}
                </p>
                {obs.severity && (
                  <Badge variant={severityVariant[obs.severity] ?? 'muted'} dot={false}>
                    {obs.severity}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <DefectIcon type={obs.class} size={16} />
                <span className="capitalize">{(CLASS_LABELS[obs.class] ?? obs.class ?? '').replace(/_/g, ' ')}</span>
                <span>· Trust {Math.round((obs.trust_score ?? 0) * 100)}</span>
              </p>

              {obs.summary && (
                <p className="text-xs text-text-secondary break-words">{obs.summary}</p>
              )}

              {cluster && (
                <p className={`text-[11px] rounded-lg px-2.5 py-1.5 break-words ${cluster.count >= 3 ? 'bg-accent/15 text-accent font-semibold' : 'bg-surface-2 text-text-secondary'}`}>
                  Reported {cluster.count}× at this spot · top trust {Math.round((cluster.topTrust ?? 0)*100)} · first {cluster.firstTime ? new Date(cluster.firstTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  {cluster.count >= 3 && <span className="ml-2 text-[10px] bg-accent text-dark px-1.5 py-0.5 rounded-full">🔥 Viral — priority</span>}
                </p>
              )}
              {obs.note && (
                <p className="text-xs text-text-primary bg-accent/10 border-l-2 border-accent rounded px-3 py-2 break-words italic">Note: {obs.note}</p>
              )}

              {obs.lat != null && (
                <p className="flex items-center gap-1 text-xs text-text-muted">
                  <MapPin size={12} />
                  {Number(obs.lat).toFixed(5)}, {Number(obs.lng).toFixed(5)}
                </p>
              )}

              <div className="pt-1 border-t border-line">
                <ShareButtons
                  title={`${obs.location ?? 'Road damage'} — ${obs.class ?? ''} (${obs.summary ?? ''})`}
                  path={`/r/${obs.id}`}
                />
              </div>

              <Link
                to="/"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-dark text-white text-sm font-semibold"
              >
                <Flame size={15} className="text-accent" /> View on Map
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
