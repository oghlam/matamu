import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Same free basemap as PublicMap (no API key needed)
const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/bright'

/**
 * LocationPicker - mini map with draggable pin.
 * User drags the red pin OR taps the map to move it.
 * Panning/zooming the map only changes the view, not the pin.
 *
 * @param {number} initialLat - initial pin latitude (mount only)
 * @param {number} initialLng - initial pin longitude (mount only)
 * @param {function} onChange - called with { lat, lng } when pin moves
 */
export default function LocationPicker({ initialLat, initialLng, onChange }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: LIGHT_STYLE,
      center: [initialLng, initialLat],
      zoom: 16,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const marker = new maplibregl.Marker({ color: '#EF4444', draggable: true })
      .setLngLat([initialLng, initialLat])
      .addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLngLat()
      onChangeRef.current?.({ lat: pos.lat, lng: pos.lng })
    })

    map.on('click', e => {
      marker.setLngLat([e.lngLat.lng, e.lngLat.lat])
      onChangeRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    })

    mapRef.current = map
    markerRef.current = marker
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // mount-once on purpose: parent remounts via key on reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-48 rounded-xl border border-line overflow-hidden bg-surface-2"
      aria-label="Location picker map"
    />
  )
}
