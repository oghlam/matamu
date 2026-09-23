import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layers, LocateFixed, SlidersHorizontal, Flame } from 'lucide-react'
import { useObservations } from '../../hooks/useObservations'
import { useGps } from '../../hooks/useGps'
import GpsBanner from '../../components/ui/GpsBanner'

// Corridor default (Jl. Lingkar Timur) — close enough to see buildings/roads
const DEFAULT_CENTER = { lat: -7.436, lng: 112.736 }
const DEFAULT_ZOOM = 15
const KPI_RADIUS_KM = 2

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371
  const dLa = ((bLat - aLat) * Math.PI) / 180
  const dLo = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLa / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLo / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const SEVERITY_COLORS = {
  critical: '#D96868',
  severe: '#D96868',
  moderate: '#E8A629',
  low: '#67B57A',
}

const CLASS_OPTIONS = ['', 'pothole', 'longitudinal_crack', 'alligator_crack', 'rutting', 'flooding', 'surface_degradation']
const CLASS_LABELS = {
  '': 'All Types',
  pothole: 'Pothole',
  longitudinal_crack: 'Longitudinal Crack',
  alligator_crack: 'Alligator Crack',
  rutting: 'Rutting',
  flooding: 'Flooding',
  surface_degradation: 'Surface Degradation',
}

export default function PublicMap() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [heatmap, setHeatmap] = useState(false)
  const [classFilter, setClassFilter] = useState('')
  const { data: observations } = useObservations({ status: 'published', damage_class: classFilter || undefined })
  const gps = useGps()

  // init map
  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: DEFAULT_ZOOM,
    })
    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  // update markers / heatmap when observations or heatmap mode changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !observations) return

    // remove old markers
    map._pub_markers?.forEach(m => m.remove())
    map._pub_markers = []

    // remove old heatmap source/layer
    if (map.getLayer?.('heatmap-layer')) map.removeLayer('heatmap-layer')
    if (map.getSource?.('heatmap-src')) map.removeSource('heatmap-src')

    const valid = observations.filter(o => o.lat != null && o.lng != null)

    if (heatmap) {
      // add heatmap via MapLibre source
      const geojson = {
        type: 'FeatureCollection',
        features: valid.map(o => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [o.lng, o.lat] },
          properties: { severity: o.severity },
        })),
      }
      const addHeatmap = () => {
        if (map.getSource('heatmap-src')) return
        map.addSource('heatmap-src', { type: 'geojson', data: geojson })
        map.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-src',
          paint: {
            'heatmap-intensity': 1,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(103,181,122,0)',
              0.5, '#E8A629',
              1, '#D96868',
            ],
            'heatmap-radius': 20,
            'heatmap-opacity': 0.75,
          },
        })
      }
      if (map.isStyleLoaded()) addHeatmap()
      else map.once('load', addHeatmap)
    } else {
      // pin markers
      valid.forEach(obs => {
        const color = SEVERITY_COLORS[obs.severity] ?? '#949893'
        const el = document.createElement('div')
        el.style.cssText = `
          width:14px;height:14px;border-radius:50%;
          background:${color};border:2.5px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer;
        `
        // Recurring signal: other reports within 50m of this pin
        const nearbyCount = valid.filter(
          v => v.id !== obs.id && haversineKm(obs.lat, obs.lng, v.lat, v.lng) <= 0.05
        ).length
        const popup = new maplibregl.Popup({ offset: 14, closeButton: false, maxWidth: '220px' })
          .setHTML(`
            <div style="font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.5">
              <p style="font-weight:700;margin:0 0 3px;color:#111311">${obs.location_label ?? 'Location'}</p>
              <p style="margin:0;color:#686C68">${CLASS_LABELS[obs.damage_class] ?? obs.damage_class ?? '—'}</p>
              ${nearbyCount > 0 ? `<p style="margin:3px 0 0;color:#D96868;font-weight:700">+${nearbyCount} more report${nearbyCount > 1 ? 's' : ''} at this spot</p>` : ''}
              <p style="margin:3px 0 0;color:#686C68">${obs.summary ?? ''}</p>
            </div>
          `)
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([obs.lng, obs.lat])
          .setPopup(popup)
          .addTo(map)
        map._pub_markers.push(marker)
      })
    }
  }, [observations, heatmap])

  const locateMe = useCallback(() => {
    if (gps.gpsOn) {
      mapRef.current?.flyTo({ center: [gps.lng, gps.lat], zoom: 15 })
    } else {
      navigator.geolocation.getCurrentPosition(pos => {
        mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15 })
      })
    }
  }, [gps])

  // Active damage within 2 km of user (fallback: corridor center)
  const anchor = gps.gpsOn ? { lat: gps.lat, lng: gps.lng } : DEFAULT_CENTER
  const within2km = (observations ?? []).filter(
    o => o.lat != null && o.lng != null && haversineKm(anchor.lat, anchor.lng, o.lat, o.lng) <= KPI_RADIUS_KM
  ).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Floating filter bar — dark pill for contrast over light map */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-dark/90 backdrop-blur-sm rounded-xl shadow-float px-3 py-2">
        <SlidersHorizontal size={14} className="text-accent shrink-0" />
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          aria-label="Filter damage type"
          className="text-xs bg-transparent text-white font-semibold focus:outline-none pr-1 [&>option]:text-text-primary"
        >
          {CLASS_OPTIONS.map(c => (
            <option key={c} value={c}>{CLASS_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* GPS status — compact, below filter bar */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 w-max max-w-[92%]">
        <GpsBanner gps={gps} compact />
      </div>

      {/* Active damage KPI — within 2 km */}
      <div className="absolute bottom-20 md:bottom-4 left-4 z-10 flex items-center gap-2 bg-dark/90 backdrop-blur-sm rounded-xl shadow-float px-3 py-2">
        <Flame size={16} className="text-accent shrink-0" />
        <span className="text-base font-bold text-white leading-none">{within2km}</span>
        <span className="text-[10px] font-medium text-white/70 leading-tight">active<br />within 2 km</span>
      </div>

      {/* Map */}
      <div ref={containerRef} className="flex-1" />

      {/* Floating controls */}
      <div className="absolute bottom-20 md:bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setHeatmap(h => !h)}
          aria-label={heatmap ? 'Show pins' : 'Show heatmap'}
          title={heatmap ? 'Show pins' : 'Show heatmap'}
          className={[
            'w-10 h-10 rounded-xl shadow-float flex items-center justify-center transition-colors',
            heatmap ? 'bg-accent text-dark' : 'bg-surface text-text-secondary hover:bg-surface-2',
          ].join(' ')}
        >
          <Layers size={18} />
        </button>
        <button
          onClick={locateMe}
          aria-label="My location"
          title="My location"
          className="w-10 h-10 rounded-xl bg-surface text-text-secondary shadow-float flex items-center justify-center hover:bg-surface-2 transition-colors"
        >
          <LocateFixed size={18} />
        </button>
      </div>
    </div>
  )
}
