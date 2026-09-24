import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layers, LocateFixed, SlidersHorizontal, Flame, Camera, Box, Mountain, Car, Loader2, Zap, Globe } from 'lucide-react'
import { useObservations } from '../../hooks/useObservations'
import { useGps } from '../../hooks/useGps'
import GpsBanner from '../../components/ui/GpsBanner'
import roadsFallback from '../../lib/roadsFallback.json'

// Free DEM (MapLibre demo, terrarium encoding) + OpenFreeMap vector for buildings — no API key
const TERRAIN_SOURCE_ID = 'terrain-dem'
const TERRAIN_SOURCE = {
  type: 'raster-dem',
  tiles: ['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'],
  tileSize: 256,
  maxzoom: 14,
  encoding: 'terrarium',
}
const BUILDING_SOURCE_ID = 'ofm-buildings'
const BUILDING_SOURCE = {
  type: 'vector',
  tiles: ['https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf'],
  maxzoom: 14,
}

// Base maps — Light (Carto) + Satellite (Esri) + Ion Bing (when PowerUp key exists)
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const SAT_STYLE = {
  version: 8,
  sources: {
    esri: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: '© Esri' },
    refPlaces: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19 },
    refRoads: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19 },
  },
  layers: [{ id: 'esri', type: 'raster', source: 'esri' }, { id: 'places', type: 'raster', source: 'refPlaces' }, { id: 'roads', type: 'raster', source: 'refRoads' }],
}
async function getIonBingStyle(token){
  try{
    const r = await fetch(`https://api.cesium.com/v1/assets/2/endpoint?access_token=${token}`)
    if(!r.ok) return null
    const j = await r.json()
    const url = j.url || j.tileUrl || ''
    if(!url) return null
    const tiles = [url.includes('{z}') ? url : url + '/{z}/{x}/{y}.png']
    return { version: 8, sources: { ionBing: { type: 'raster', tiles, tileSize: 256, attribution: '© Cesium ion · Bing Maps' } }, layers: [{ id: 'ionBing', type: 'raster', source: 'ionBing' }] }
  }catch{ return null }
}

// Corridor default (Jl. Lingkar Timur) — close enough to see buildings/roads
const DEFAULT_CENTER = { lat: -7.436, lng: 112.736 }
const DEFAULT_ZOOM = 15
const KPI_RADIUS_KM = 2

// — Traffic free (sim, without TomTom) — Overpass roads + animated dots, ponytail: free/CORS, fallback sim —
const TRAFFIC_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
const TRAFFIC_MAX_DOTS = 160 // kotak DOM lebih berat dari circle — 160 cukup, ponytail: kecil < pin 14px
const TRAFFIC_BOX_GLOW = '0 0 4px rgba(0,230,120,0.9), 0 0 8px rgba(0,230,120,0.35)'
const TRAFFIC_LIVE_COLORS = { free: '#00e676', slow: '#E8A629', jam: '#D96868' }
function tomtomBucket(current, free) {
  if (!free || free <= 0 || !current) return null
  const r = current / free
  if (r > 0.75) return 'free'
  if (r > 0.4) return 'slow'
  return 'jam'
}
async function fetchTomTomFlow(lat, lon, key) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 7000)
  try {
    const r = await fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${key}`, { signal: ctrl.signal })
    clearTimeout(t)
    if (!r.ok) return null
    const j = await r.json()
    const f = j.flowSegmentData
    if (!f) return null
    return tomtomBucket(f.currentSpeed, f.freeFlowSpeed)
  } catch { clearTimeout(t); return null }
}
const TRAFFIC_SPEED = { motorway: 25, trunk: 20, primary: 14, secondary: 11, tertiary: 8, residential: 5, unclassified: 5 }
const TRAFFIC_DENSITY = { motorway: 3, trunk: 2.5, primary: 2, secondary: 1.5, tertiary: 1, residential: 0.5, unclassified: 0.4 }
function trafficBuildQuery(s, w, n, e, majorOnly = true) {
  const r = majorOnly
    ? '^(motorway|trunk|primary|secondary)$'
    : '^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$'
  return `[out:json][timeout:25];(way["highway"~"${r}"](${s},${w},${n},${e}););out geom qt;`
}
function syntheticRoads(lngC, latC) {
  // fallback ketika Overpass diblokir — pakai geometri jalan asli Sidoarjo dari roadsFallback.json
  const isDefault = Math.abs(latC - DEFAULT_CENTER.lat) < 0.025 && Math.abs(lngC - DEFAULT_CENTER.lng) < 0.025
  if (isDefault && roadsFallback.sidoarjo) {
    return roadsFallback.sidoarjo.map(r => ({
      coords: r.coords, type: r.type,
      segDist: r.coords.slice(0, -1).map((_, i) => haversineKm(r.coords[i][1], r.coords[i][0], r.coords[i + 1][1], r.coords[i + 1][0]) * 1000)
    }))
  }
  const d = 0.008 // ~900m, pendek biar tetap di jalan, tidak ke sawah
  const mk = (a, b) => ({ coords: [a, b], type: 'primary', segDist: [haversineKm(a[1], a[0], b[1], b[0]) * 1000] })
  return [
    mk([lngC - d, latC], [lngC + d, latC]),
    mk([lngC, latC - d], [lngC, latC + d]),
    mk([lngC - d, latC + 0.003], [lngC + d, latC + 0.003]),
    mk([lngC - 0.003, latC - d], [lngC - 0.003, latC + d]),
  ]
}
function trafficRoadLen(coords) {
  let l = 0
  for (let i = 0; i < coords.length - 1; i++) l += haversineKm(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]) * 1000
  return l
}
async function fetchTrafficWithMirrors(query) {
  // Try server-side proxy first (reliable, bypasses browser CORS/firewall) — like God’s Eye
  const tryUrls = ['/api/overpass', ...TRAFFIC_MIRRORS]
  for (const url of tryUrls) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 12000)
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(query)}`, signal: ctrl.signal })
      clearTimeout(t)
      if (!r.ok) continue
      const j = await r.json()
      if (Array.isArray(j.elements) && j.elements.length) return j
      // proxy returns 502 on all mirrors failed — continue to direct
      if (j && j.error) continue
    } catch { clearTimeout(t); continue }
  }
  throw new Error('All Overpass mirrors failed')
}

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
  high: '#D96868',
  moderate: '#E8A629',
  medium: '#E8A629',
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
  const [is3D, setIs3D] = useState(() => {
    try { return localStorage.getItem('matamu-3d') === '1' } catch { return false }
  })
  const [showHint, setShowHint] = useState(() => {
    try { return localStorage.getItem('matamu-3d-hint') !== '1' } catch { return true }
  })
  const is3DRef = useRef(is3D)
  is3DRef.current = is3D
  const [trafficOn, setTrafficOn] = useState(false)
  const [trafficLoading, setTrafficLoading] = useState(false)
  const [trafficMeta, setTrafficMeta] = useState(null) // { roads, dots, source } — like God’s Eye getStats
  const [trafficError, setTrafficError] = useState(null)
  const [showPowerUp, setShowPowerUp] = useState(false)
  const [powerKey, setPowerKey] = useState(() => { try { return localStorage.getItem('matamu-tomtom-key') || import.meta.env.VITE_TOMTOM_API_KEY || '' } catch { return import.meta.env.VITE_TOMTOM_API_KEY || '' } })
  const [ionKey, setIonKey] = useState(() => { try { return localStorage.getItem('matamu-cesium-ion-token') || import.meta.env.VITE_CESIUM_ION_TOKEN || '' } catch { return import.meta.env.VITE_CESIUM_ION_TOKEN || '' } })
  const [baseMode, setBaseMode] = useState('light') // light | sat | ion
  const trafficRafRef = useRef(null)
  const trafficDotsRef = useRef([])
  const trafficRoadsRef = useRef([])
  const { data: observations, reload } = useObservations({ status: 'published', detected_class: classFilter || undefined })
  const gps = useGps()

  // Refetch when tab regains focus — picks up reports accepted in the operator dashboard
  const reloadRef = useRef(reload)
  reloadRef.current = reload
  useEffect(() => {
    const onFocus = () => reloadRef.current()
    const onVis = () => { if (document.visibilityState === 'visible') reloadRef.current() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // init map
  useEffect(() => {
    if (mapRef.current) return
    const start3D = is3DRef.current
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: LIGHT_STYLE,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: DEFAULT_ZOOM,
      pitch: start3D ? 58 : 0,
      bearing: start3D ? -12 : 0,
      maxPitch: 65,
      antialias: true,
    })
    // enable free pitch/rotate with right-drag + ctrl
    mapRef.current.dragRotate.enable()
    mapRef.current.touchPitch.enable()
    // if persisted 3D, apply terrain after load
    if (start3D) {
      const applyPersisted = () => {
        const m = mapRef.current; if (!m) return
        if (!m.getSource(TERRAIN_SOURCE_ID)) m.addSource(TERRAIN_SOURCE_ID, TERRAIN_SOURCE)
        try { m.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.35 }) } catch {}
        if (!m.getLayer('hillshade')) try { m.addLayer({ id: 'hillshade', type: 'hillshade', source: TERRAIN_SOURCE_ID, paint: { 'hillshade-exaggeration': 0.35 } }) } catch {}
        if (!m.getSource(BUILDING_SOURCE_ID)) m.addSource(BUILDING_SOURCE_ID, BUILDING_SOURCE)
        if (!m.getLayer('3d-buildings')) try { m.addLayer({ id: '3d-buildings', type: 'fill-extrusion', source: BUILDING_SOURCE_ID, 'source-layer': 'building', paint: { 'fill-extrusion-color': '#d8d8d8', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 12], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.82 } }) } catch {}
      }
      if (mapRef.current.isStyleLoaded()) applyPersisted()
      else mapRef.current.once('load', applyPersisted)
    }
    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  // auto-hide hint after 6s
  useEffect(() => {
    if (!showHint) return
    const t = setTimeout(() => {
      setShowHint(false)
      try { localStorage.setItem('matamu-3d-hint', '1') } catch {}
    }, 6000)
    return () => clearTimeout(t)
  }, [showHint])

  // 3D toggle — terrain (free DEM) + extruded buildings, free without key
  const toggle3D = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const next = !is3DRef.current
    try {
      if (next) {
        // DEM terrain — add once, survive style reloads via style.load re-add
        if (!map.getSource(TERRAIN_SOURCE_ID)) {
          map.addSource(TERRAIN_SOURCE_ID, TERRAIN_SOURCE)
        }
        map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.35 })
        // hillshade optional, very light
        if (!map.getLayer('hillshade')) {
          map.addLayer({ id: 'hillshade', type: 'hillshade', source: TERRAIN_SOURCE_ID, paint: { 'hillshade-exaggeration': 0.35 } })
        }
        // 3D buildings — OpenFreeMap vector, free
        if (!map.getSource(BUILDING_SOURCE_ID)) {
          map.addSource(BUILDING_SOURCE_ID, BUILDING_SOURCE)
        }
        if (!map.getLayer('3d-buildings')) {
          // place below labels if any, otherwise on top
          const beforeId = map.getLayer('place_label_city') ? 'place_label_city' : undefined
          map.addLayer({
            id: '3d-buildings',
            type: 'fill-extrusion',
            source: BUILDING_SOURCE_ID,
            'source-layer': 'building',
            paint: {
              'fill-extrusion-color': '#d8d8d8',
              'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 12],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.82,
            },
          }, beforeId)
        }
        map.easeTo({ pitch: 58, bearing: -12, duration: 900 })
      } else {
        map.setTerrain(null)
        if (map.getLayer('hillshade')) map.removeLayer('hillshade')
        if (map.getLayer('3d-buildings')) map.removeLayer('3d-buildings')
        // keep sources for instant re-toggle (cheap), remove if you want to free memory
        map.easeTo({ pitch: 0, bearing: 0, duration: 700 })
      }
      is3DRef.current = next
      setIs3D(next)
      try { localStorage.setItem('matamu-3d', next ? '1' : '0') } catch {}
      if (showHint) { setShowHint(false); try { localStorage.setItem('matamu-3d-hint','1') } catch {} }
    } catch (e) {
      console.warn('[PublicMap] 3D toggle failed:', e)
      // fallback: ensure 2D clean state
      try { map.setTerrain(null) } catch {}
      is3DRef.current = false
      setIs3D(false)
    }
  }, [showHint])

  // Base map — Light ↔ Satellite ↔ Ion Bing (when Ion key in PowerUp)
  const toggleBaseMap = useCallback(async () => {
    const map = mapRef.current
    if (!map) return
    const ion = (() => { try { const ls = (localStorage.getItem('matamu-cesium-ion-token') || '').trim(); if (ls) return ls; return (import.meta.env.VITE_CESIUM_ION_TOKEN || '').trim() } catch { return (import.meta.env.VITE_CESIUM_ION_TOKEN || '').trim() } })()
    if (baseMode === 'light') {
      map.setStyle(SAT_STYLE)
      setBaseMode('sat')
    } else if (baseMode === 'sat') {
      if (ion) {
        const ionStyle = await getIonBingStyle(ion)
        if (ionStyle) { map.setStyle(ionStyle); setBaseMode('ion'); return }
      }
      map.setStyle(LIGHT_STYLE)
      setBaseMode('light')
    } else {
      map.setStyle(LIGHT_STYLE)
      setBaseMode('light')
    }
  }, [baseMode])

  // Traffic free — thin green [] glowing boxes (not circles), smaller than 14px pin, ponytail: lightweight DOM markers
  const clearTraffic = useCallback(() => {
    const map = mapRef.current
    if (trafficRafRef.current) { cancelAnimationFrame(trafficRafRef.current); trafficRafRef.current = null }
    if (map?._traffic_markers) { map._traffic_markers.forEach(m => { try { m.remove() } catch {} }); map._traffic_markers = [] }
    trafficDotsRef.current = []; trafficRoadsRef.current = []
    try { if (map?.getLayer('traffic-dots')) map.removeLayer('traffic-dots') } catch {}
    try { if (map?.getSource('traffic-dots')) map.removeSource('traffic-dots') } catch {}
    setTrafficMeta(null); setTrafficError(null)
  }, [])
  const toggleTraffic = useCallback(async () => {
    const map = mapRef.current
    if (!map) return
    if (trafficOn) { clearTraffic(); setTrafficOn(false); setTrafficLoading(false); return }
    if (map.getZoom() < 13) map.easeTo({ zoom: 14, duration: 600 })
    setTrafficOn(true); setTrafficLoading(true); setTrafficError(null); setTrafficMeta(null)
    try {
      const b = map.getBounds()
      const s = b.getSouth(), w = b.getWest(), n = b.getNorth(), e = b.getEast()
      // clamp bbox ~0.06° (~6km) biar Overpass ringan — mirip clampBounds gods-eye
      const latC = (s + n) / 2, lngC = (w + e) / 2
      const d = 0.03
      let j = null
      try {
        const q = trafficBuildQuery(latC - d, lngC - d, latC + d, lngC + d, true)
        j = await fetchTrafficWithMirrors(q)
      } catch (e) {
        console.warn('[Traffic] Overpass blocked, pakai synthetic fallback', e.message)
        j = null
      }
      let roads = []
      if (j && Array.isArray(j.elements) && j.elements.length) {
        for (const el of (j.elements || [])) {
          if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue
          const coords = el.geometry.map(g => [g.lon, g.lat])
          if (coords.length > 40) { const step = Math.ceil(coords.length / 40); const f = []; for (let i = 0; i < coords.length; i += step) f.push(coords[i]); if (f[f.length - 1] !== coords[coords.length - 1]) f.push(coords[coords.length - 1]); coords.length = 0; coords.push(...f) }
          const type = el.tags?.highway || 'unclassified'
          const segDist = []
          for (let i = 0; i < coords.length - 1; i++) segDist.push(haversineKm(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]) * 1000)
          roads.push({ coords, type, segDist })
        }
      }
      if (!roads.length) {
        // Overpass blocked/empty → synthetic still animates, user still sees traffic
        roads = syntheticRoads(lngC, latC)
        console.info('[Traffic] fallback synthetic roads', roads.length)
      }
      // PowerUp live: env key (test) or localStorage — live = green/orange/red, God’s Eye style
      const tomKey = (() => { try { const ls = (localStorage.getItem('matamu-tomtom-key') || '').trim(); if (ls) return ls; return (import.meta.env.VITE_TOMTOM_API_KEY || '').trim() } catch { return (import.meta.env.VITE_TOMTOM_API_KEY || '').trim() } })()
      const isLive = !!tomKey
      if (tomKey) {
        const live = await Promise.all(roads.map(async rd => {
          const mid = rd.coords[Math.floor(rd.coords.length / 2)]
          const b = await fetchTomTomFlow(mid[1], mid[0], tomKey)
          return b // free/slow/jam or null
        }))
        roads.forEach((rd, i) => { if (live[i]) rd.liveBucket = live[i] })
        console.info('[Traffic] live buckets', live)
      }
      // budget 700 — distribusi adil ala gods-eye allocateRoadDotBudgets
      const planned = roads.map(rd => {
        const len = trafficRoadLen(rd.coords)
        const spacing = map.getZoom() < 14 ? 250 : map.getZoom() < 15 ? 150 : 80
        const mult = (TRAFFIC_DENSITY[rd.type] || 1)
        return Math.max(1, Math.floor((len / spacing) * mult))
      })
      const budgets = new Array(roads.length).fill(0)
      let rem = TRAFFIC_MAX_DOTS
      const order = planned.map((c, i) => ({ c, i })).sort((a, b) => b.c - a.c)
      for (const o of order) { if (rem <= 0) break; if (o.c <= 0) continue; budgets[o.i] = 1; rem-- }
      let totalRem = 0; for (let i = 0; i < planned.length; i++) totalRem += Math.max(0, planned[i] - budgets[i])
      if (totalRem > 0 && rem > 0) {
        for (let i = 0; i < planned.length; i++) {
          const cap = Math.max(0, planned[i] - budgets[i]); if (!cap) continue
          const add = Math.min(cap, Math.floor((cap / totalRem) * rem)); budgets[i] += add
        }
      }
      const dots = []
      for (let ri = 0; ri < roads.length; ri++) {
        const rd = roads[ri]; const cnt = budgets[ri]; if (!cnt) continue
        const mps = TRAFFIC_SPEED[rd.type] || 5
        for (let k = 0; k < cnt; k++) {
          if (dots.length >= TRAFFIC_MAX_DOTS) break
          const seg = Math.floor(Math.random() * (rd.coords.length - 1))
          const t = Math.random()
          const dir = k % 2 === 0 ? 1 : -1
          dots.push({ road: rd, seg, t, dir, mps: mps * (0.7 + Math.random() * 0.6) })
        }
      }
      trafficRoadsRef.current = roads; trafficDotsRef.current = dots
      // green boxes — live colored if PowerUp key exists, else sim green
      if (!map._traffic_markers) map._traffic_markers = []
      map._traffic_markers.forEach(m => { try { m.remove() } catch {} }); map._traffic_markers = []
      for (let i = 0; i < dots.length; i++) {
        const rd = dots[i].road
        const bucket = rd.liveBucket || 'free'
        const col = TRAFFIC_LIVE_COLORS[bucket] || '#00e676'
        const glow = bucket === 'jam' ? '0 0 5px rgba(217,104,104,0.9), 0 0 10px rgba(217,104,104,0.4)' : bucket === 'slow' ? '0 0 5px rgba(232,166,41,0.9), 0 0 10px rgba(232,166,41,0.35)' : TRAFFIC_BOX_GLOW
        const el = document.createElement('div')
        el.style.cssText = `width:6px;height:4px;border:1px solid ${col};border-radius:1px;box-sizing:border-box;background:${bucket === 'free' ? 'rgba(0,230,118,0.10)' : bucket === 'slow' ? 'rgba(232,166,41,0.12)' : 'rgba(217,104,104,0.14)'};box-shadow:${glow};pointer-events:none;`
        const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(dots[i].road.coords[0]).addTo(map)
        map._traffic_markers.push(m)
      }
      setTrafficMeta({ roads: roads.length, dots: dots.length, live: isLive, source: j ? 'Overpass' : 'Fallback' })
      console.info(`[Traffic] ${roads.length} roads → ${dots.length} boxes hijau []`)
      // animasi — update lngLat marker DOM (160 kotak × 60fps ringan)
      let last = performance.now()
      const tick = (now) => {
        const dt = Math.min((now - last) / 1000, 0.1); last = now
        if (!map._traffic_markers || !map._traffic_markers.length) return
        for (let idx = 0; idx < trafficDotsRef.current.length; idx++) {
          const d = trafficDotsRef.current[idx]
          const segLen = d.road.segDist[d.seg] || 1
          d.t += (d.mps * dt / segLen) * d.dir
          if (d.t >= 1) { d.t -= 1; d.seg++; if (d.seg >= d.road.coords.length - 1) { d.seg = 0; d.t = Math.random() * 0.3 } }
          else if (d.t <= 0) { d.t += 1; d.seg--; if (d.seg < 0) { d.seg = d.road.coords.length - 2; d.t = 1 - Math.random() * 0.3 } }
          const a = d.road.coords[d.seg], b = d.road.coords[d.seg + 1]
          const lng = a[0] + (b[0] - a[0]) * d.t, lat = a[1] + (b[1] - a[1]) * d.t
          const mk = map._traffic_markers[idx]
          if (mk) mk.setLngLat([lng, lat])
        }
        trafficRafRef.current = requestAnimationFrame(tick)
      }
      trafficRafRef.current = requestAnimationFrame(tick)
    } catch (e) {
      console.warn('[Traffic] fetch failed', e)
      setTrafficError(e.message || 'Overpass busy')
      clearTraffic(); setTrafficOn(false)
    } finally { setTrafficLoading(false) }
  }, [trafficOn, clearTraffic])

  // cleanup traffic on unmount
  useEffect(() => () => clearTraffic(), [clearTraffic])

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
      // pin markers — PWA auto-tilt: saat 3D aktif, tap pin langsung fly miring biar gedung keliatan
      valid.forEach(obs => {
        const color = SEVERITY_COLORS[obs.severity] ?? '#949893'
        const el = document.createElement('div')
        el.style.cssText = `
          width:14px;height:14px;border-radius:50%;
          background:${color};border:2.5px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer;
        `
        el.addEventListener('click', () => {
          if (is3DRef.current) {
            // smooth tilt-to-target, keep 3D context — ringan, no extra fetch
            map.flyTo({ center: [obs.lng, obs.lat], zoom: Math.max(map.getZoom(), 16.5), pitch: 58, bearing: -12, duration: 900, essential: true })
          }
        })
        // Recurring signal: other reports within 50m of this pin
        const nearbyCount = valid.filter(
          v => v.id !== obs.id && haversineKm(obs.lat, obs.lng, v.lat, v.lng) <= 0.05
        ).length
        // Share payload — deep link to this specific report
        const shareText = `${obs.location_label ?? 'Road damage'} — ${obs.damage_class ?? ''} (${obs.summary ?? ''}) via Mat(a)Mu`
        const shareUrl = window.location.origin + '/r/' + obs.id
        const enc = encodeURIComponent(shareText + ' ' + shareUrl)
        const btn = (href, bg, glyph, label, onclick) =>
          `<a ${href ? `href="${href}" target="_blank" rel="noopener"` : ''}` +
          ` ${onclick ? `onclick="${onclick}"` : ''}` +
          ` title="${label}" aria-label="${label}" style="width:28px;height:28px;border-radius:50%;` +
          `background:${bg};display:inline-flex;align-items:center;justify-content:center;` +
          `cursor:pointer;text-decoration:none">${glyph}</a>`
        const glyph = (paths) =>
          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
        const shareRow = `<p style="margin:6px 0 4px;color:#111311;font-weight:700">Share it</p>` +
          `<div style="display:flex;gap:6px;align-items:center">` +
          btn(`https://wa.me/?text=${enc}`, '#25D366',
            glyph('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>'),
            'Share to WhatsApp') +
          btn(null, '#E1306C',
            glyph('<rect width="18" height="18" x="3" y="3" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.8" r="0.6" fill="#fff"/>'),
            'Copy link for Instagram',
            `navigator.clipboard&&navigator.clipboard.writeText('${shareUrl}');return false;`) +
          btn(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '#1877F2',
            glyph('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
            'Share to Facebook') +
          btn(null, '#111311',
            glyph('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
            'Copy link for TikTok',
            `navigator.clipboard&&navigator.clipboard.writeText('${shareUrl}');return false;`) +
          btn(`https://twitter.com/intent/tweet?text=${enc}`, '#111311',
            glyph('<path d="M4 4l16 16M20 4L4 20"/>'),
            'Share to X') +
          `</div>`
        const popup = new maplibregl.Popup({ offset: 14, closeButton: false, maxWidth: '240px' })
          .setHTML(`
            <div style="font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.5;min-width:180px">
              ${obs.evidence_url ? `<img src="${obs.evidence_url}" alt="Damage photo" loading="lazy" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:6px;display:block" />` : ''}
              <p style="font-weight:700;margin:0 0 3px;color:#111311">${obs.location_label ?? 'Location'}</p>
              <p style="margin:0;color:#686C68">${CLASS_LABELS[obs.damage_class] ?? obs.damage_class ?? '—'}</p>
              ${nearbyCount > 0 ? `<p style="margin:3px 0 0;color:#D96868;font-weight:700">+${nearbyCount} more report${nearbyCount > 1 ? 's' : ''} at this spot</p>` : ''}
              <p style="margin:3px 0 0;color:#686C68">${obs.summary ?? ''}</p>
              ${shareRow}
            </div>
          `)
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([obs.lng, obs.lat])
          .setPopup(popup)
          .addTo(map)
        map._pub_markers.push(marker)
      })
    }
  }, [observations, heatmap, is3D])

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

      {/* GPS status — compact, top-right corner (never under tooltips) */}
      <div className="absolute top-3 right-3 z-10 w-max max-w-[46%]">
        <GpsBanner gps={gps} compact />
      </div>

      {/* PWA 3D hint — ringan, auto-dismiss, muncul sekali */}
      {showHint && !is3D && (
        <div className="absolute top-[56px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-dark/90 backdrop-blur-sm rounded-full shadow-float px-3 py-1.5 text-[11px] font-medium text-white whitespace-nowrap">
          <Mountain size={12} className="text-accent shrink-0" />
          <span>Tap <Box size={10} className="inline -mt-0.5" /> for 3D • pinch with 2 fingers to tilt</span>
          <button onClick={() => { setShowHint(false); try{localStorage.setItem('matamu-3d-hint','1')}catch{} }} aria-label="Dismiss hint" className="ml-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">✕</button>
        </div>
      )}

      {/* Active damage KPI — within 2 km */}
      <div className="absolute bottom-20 md:bottom-4 left-4 z-10 flex items-center gap-2 bg-dark/90 backdrop-blur-sm rounded-xl shadow-float px-3 py-2">
        <Flame size={16} className="text-accent shrink-0" />
        <span className="text-base font-bold text-white leading-none">{within2km}</span>
        <span className="text-[10px] font-medium text-white/70 leading-tight">active<br />within 2 km</span>
      </div>

      {/* Report CTA — viewing is open, creating requires sign-in (gated in /capture) */}
      <Link
        to="/capture"
        className="absolute bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-accent text-dark rounded-xl shadow-float px-4 py-2.5 text-sm font-bold whitespace-nowrap active:scale-95 transition-transform"
      >
        <Camera size={16} /> Report Damage
      </Link>

      {/* Map */}
      <div ref={containerRef} className="flex-1" />

      {/* Floating controls */}
      <div className="absolute bottom-20 md:bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setShowPowerUp(true)}
          aria-label="Power Up"
          title={powerKey ? 'Power Up — TomTom key saved' : 'Power Up — add TomTom key for live traffic'}
          className="relative w-10 h-10 rounded-xl shadow-float flex items-center justify-center bg-surface text-text-secondary hover:bg-surface-2 transition-colors"
        >
          <Zap size={18} />
          {!powerKey && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-surface"></span>}
        </button>
        <button
          onClick={toggleBaseMap}
          aria-label="Base map"
          title={baseMode === 'light' ? 'Satellite' : baseMode === 'sat' ? (ionKey ? 'Bing (Ion)' : 'Light') : 'Light'}
          className="w-10 h-10 rounded-xl shadow-float flex items-center justify-center bg-surface text-text-secondary hover:bg-surface-2 transition-colors"
        >
          <Globe size={18} />
        </button>
        <button
          onClick={toggleTraffic}
          aria-label="Traffic"
          title="Traffic"
          className={[
            'w-10 h-10 rounded-xl shadow-float flex items-center justify-center transition-colors',
            trafficOn ? 'bg-accent text-dark' : 'bg-surface text-text-secondary hover:bg-surface-2',
          ].join(' ')}
        >
          {trafficLoading ? <Loader2 size={18} className="animate-spin" /> : <Car size={18} />}
        </button>
        <button
          onClick={toggle3D}
          aria-label={is3D ? '2D' : '3D'}
          title={is3D ? '2D' : '3D'}
          className={[
            'w-10 h-10 rounded-xl shadow-float flex items-center justify-center transition-colors',
            is3D ? 'bg-accent text-dark' : 'bg-surface text-text-secondary hover:bg-surface-2',
          ].join(' ')}
        >
          {is3D ? <Mountain size={18} /> : <Box size={18} />}
        </button>
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

      {/* Traffic status chip — God’s Eye style: LOADING → COMPLETED — top so not hidden by bottom controls */}
      {(trafficLoading || trafficMeta || trafficError) && (
        <div className="absolute top-[92px] md:top-[108px] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 z-20 flex flex-col items-center md:items-end gap-1 pointer-events-none">
          {trafficLoading && (
            <span className="inline-flex items-center gap-1.5 bg-dark text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-float">
              <Loader2 size={12} className="animate-spin" /> Fetching data…
            </span>
          )}
          {!trafficLoading && trafficMeta && (
            <span className="inline-flex items-center gap-1.5 bg-white text-tp text-[11px] font-bold px-3 py-1.5 rounded-full shadow-float border border-gray-200">
              <span className={`w-2 h-2 rounded-full ${trafficMeta.live ? 'bg-ok' : 'bg-accent'}`}></span>
              {trafficMeta.dots} boxes • {trafficMeta.roads} roads • {trafficMeta.live ? 'LIVE' : 'SIM'} • Completed{trafficMeta.source === 'Fallback' ? ' • Fallback' : ''}
            </span>
          )}
          {trafficError && !trafficLoading && (
            <span className="inline-flex items-center gap-1.5 bg-bad text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-float">
              Traffic failed — {trafficError}
            </span>
          )}
        </div>
      )}

      {/* PowerUp Modal — ROUND STATION · PROVIDER SETTINGS (like God’s Eye) */}
      {showPowerUp && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" onClick={() => setShowPowerUp(false)}></div>
          <div className="relative w-full max-w-[420px] bg-surface rounded-2xl shadow-float border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-accent uppercase">ROUND STATION · PROVIDER SETTINGS</p>
                <h2 className="text-base font-bold text-text-primary mt-1">Power up the globe</h2>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">The map already flies keyless. Every key below switches on another real feed — paste one and it’s saved locally. Without it, the map runs with simulation.</p>
              </div>
              <button onClick={() => setShowPowerUp(false)} aria-label="Close" className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary hover:bg-gray-200">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <strong className="text-sm font-bold">TOMTOM</strong>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">FREE</span>
                  <a href="https://developer.tomtom.com" target="_blank" rel="noopener" className="ml-auto text-[11px] font-bold text-accent hover:underline">GET KEY ↗</a>
                </div>
                <p className="text-xs text-text-secondary mt-1.5">Real live traffic — green/orange/red flow. Without a key it runs a simulation on real roads.</p>
                <div className="mt-3 flex gap-2">
                  <input value={powerKey} onChange={e => setPowerKey(e.target.value)} type="password" autoComplete="off" spellCheck={false} placeholder="paste TOMTOM_API_KEY" className="flex-1 bg-surface-2 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/40" />
                  <button onClick={() => { const v = powerKey.trim(); if (!v) return; if (v.length > 512 || /\s/.test(v)) { alert('Invalid key'); return } try { localStorage.setItem('matamu-tomtom-key', v) } catch {}; setShowPowerUp(false) }} className="px-4 py-2 rounded-lg bg-dark text-white text-xs font-bold hover:bg-dark/90">Save</button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[11px] ${powerKey ? 'text-ok font-medium' : 'text-text-secondary'}`}>{powerKey ? '● Saved — live traffic will be used' : '○ Not set — simulation mode'}</span>
                  {powerKey && <button onClick={() => { if (!confirm('Remove TomTom key?')) return; try { localStorage.removeItem('matamu-tomtom-key') } catch {}; setPowerKey('') }} className="ml-auto text-[11px] font-bold text-bad hover:underline">Remove</button>}
                </div>
              </section>
              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <strong className="text-sm font-bold">CESIUM ION</strong>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">FREE</span>
                  <a href="https://ion.cesium.com/tokens" target="_blank" rel="noopener" className="ml-auto text-[11px] font-bold text-accent hover:underline">GET KEY ↗</a>
                </div>
                <p className="text-xs text-text-secondary mt-1.5">Base map — Bing aerial & labels + world terrain. Without a key the map uses keyless OSM/Esri. Toggle via globe button.</p>
                <div className="mt-3 flex gap-2">
                  <input value={ionKey} onChange={e => setIonKey(e.target.value)} type="password" autoComplete="off" spellCheck={false} placeholder="paste CESIUM_ION_TOKEN" className="flex-1 bg-surface-2 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/40" />
                  <button onClick={() => { const v = ionKey.trim(); if (!v) return; if (v.length > 512 || /\s/.test(v)) { alert('Invalid key'); return } try { localStorage.setItem('matamu-cesium-ion-token', v) } catch {}; setShowPowerUp(false) }} className="px-4 py-2 rounded-lg bg-dark text-white text-xs font-bold hover:bg-dark/90">Save</button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[11px] ${ionKey ? 'text-ok font-medium' : 'text-text-secondary'}`}>{ionKey ? '● Saved — Bing maps enabled' : '○ Not set — keyless mode'}</span>
                  {ionKey && <button onClick={() => { if (!confirm('Remove Cesium Ion token?')) return; try { localStorage.removeItem('matamu-cesium-ion-token') } catch {}; setIonKey('') }} className="ml-auto text-[11px] font-bold text-bad hover:underline">Remove</button>}
                </div>
              </section>
              <p className="text-[11px] text-text-secondary bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Tip: Leave empty to keep keyless. Live feeds activate on next toggle.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
