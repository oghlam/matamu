"""Overpass proxy — server-side multi-mirror fetch, like God’s Eye vite plugin but for Django."""
import json
import urllib.request
import urllib.parse
import urllib.error
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
TIMEOUT = 12  # seconds per mirror, like God’s Eye OVERPASS_TIMEOUT_MS 22s but shorter for UX

@csrf_exempt
@require_POST
def overpass_proxy(request):
    # Read form-encoded body: data=...
    body = request.body.decode("utf-8", errors="ignore") if request.body else ""
    # Also handle request.POST
    data = request.POST.get("data") or ""
    if not data and body:
        # parse raw body
        try:
            parsed = urllib.parse.parse_qs(body)
            data = parsed.get("data", [""])[0]
        except Exception:
            data = ""
    if not data:
        return JsonResponse({"error": "Missing data query"}, status=400)
    if len(data) > 24000:
        return JsonResponse({"error": "Query too large"}, status=413)

    last_err = None
    for url in MIRRORS:
        try:
            req_body = urllib.parse.urlencode({"data": data}).encode("utf-8")
            req = urllib.request.Request(url, data=req_body, method="POST")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
            req.add_header("User-Agent", "Matamu/1.0 OverpassProxy")
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                if resp.status != 200:
                    last_err = f"{url} HTTP {resp.status}"
                    continue
                raw = resp.read()
                # Validate JSON
                try:
                    j = json.loads(raw.decode("utf-8"))
                except Exception as e:
                    last_err = f"{url} invalid JSON: {e}"
                    continue
                # Success — return JSON directly
                return JsonResponse(j, safe=False)
        except urllib.error.HTTPError as e:
            last_err = f"{url} HTTP {e.code}"
            continue
        except Exception as e:
            last_err = f"{url} {e}"
            continue

    return JsonResponse({"error": "All Overpass mirrors failed", "detail": last_err}, status=502)
