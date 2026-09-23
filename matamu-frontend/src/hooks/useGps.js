import { useState, useEffect, useCallback, useRef } from 'react'

// Continuous GPS watch. Status:
// 'searching' — waiting for first fix
// 'on'        — live position available
// 'off'       — permission denied / unavailable / timeout
// 'unsupported' — browser has no geolocation
export function useGps() {
  const [state, setState] = useState({
    status: 'searching',
    lat: null,
    lng: null,
    accuracy: null,
    message: '',
  })
  const watchId = useRef(null)

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState(s => ({ ...s, status: 'unsupported', message: 'Geolocation is not supported by this browser.' }))
      return
    }
    setState(s => ({ ...s, status: 'searching', message: '' }))
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    watchId.current = navigator.geolocation.watchPosition(
      pos => setState({
        status: 'on',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        message: '',
      }),
      err => {
        let message = 'Location unavailable.'
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location permission denied. Enable location in your browser / device settings.'
        } else if (err.code === err.TIMEOUT) {
          message = 'Location request timed out. Make sure you are outdoors with a clear sky view.'
        }
        setState(s => ({ ...s, status: 'off', message }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
  }, [])

  useEffect(() => {
    start()
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [start])

  return { ...state, retry: start, gpsOn: state.status === 'on' }
}
