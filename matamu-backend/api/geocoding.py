"""Google Maps reverse geocoding — lat/lng → alamat label.

ponytail: returns koordinat string jika GOOGLE_MAPS_API_KEY tidak ada.
"""
import os
import logging
import requests

logger = logging.getLogger(__name__)
GOOGLE_MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")


def reverse_geocode(lat: float, lng: float) -> str:
    """Returns human-readable address, e.g. 'Jl. Lingkar Timur, Sidoarjo'.
    Falls back to 'lat,lng' string if API key missing or request fails.
    """
    if not GOOGLE_MAPS_KEY:
        return f"{lat:.5f},{lng:.5f}"

    try:
        resp = requests.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"latlng": f"{lat},{lng}", "key": GOOGLE_MAPS_KEY,
                    "language": "id", "result_type": "route|street_address"},
            timeout=5,
        )
        data = resp.json()
        results = data.get("results", [])
        if results:
            return results[0].get("formatted_address", f"{lat:.5f},{lng:.5f}")
    except Exception as e:
        logger.warning("reverse_geocode failed: %s", e)

    return f"{lat:.5f},{lng:.5f}"
