// hooks/useObservations.js — fetch /api/v1/observations with optional filters
import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

// Normalize Django schema → frontend schema
// Django: { class, location (string), created_at }
// Frontend expects: { damage_class, location_label, lat, lng, timestamp }
function normalize(obs) {
  return {
    ...obs,
    damage_class: obs.damage_class ?? obs.class,
    location_label: obs.location_label ?? obs.location_label_str ?? obs.location,
    timestamp: obs.timestamp ?? obs.created_at,
  }
}

export function useObservations(params = {}, { skip = false } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState(null)

  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString()

  const load = useCallback(() => {
    if (skip) return
    setLoading(true)
    setError(null)
    api.get(`/api/v1/observations${query ? '?' + query : ''}`)
      .then(res => {
        const raw = res.observations ?? res ?? []
        setData(Array.isArray(raw) ? raw.map(normalize) : [])
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [query, skip])

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: load }
}
