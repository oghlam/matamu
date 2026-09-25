from django.conf import settings


def pwa(request):
    """Expose warga PWA URL to all dashboard templates.

    Local:  http://localhost:5173 (PWA dev server)
    Prod EC2:
      - dashboard = https://matamu-dash.<ip>.nip.io
      - PWA       = https://matamu.<ip>.nip.io
    If PWA_URL env is set to a non-localhost value, that value is used as-is.
    Otherwise derive from request host: matamu-dash.* → matamu.*
    """
    pwa_url = settings.PWA_URL
    # Explicit env override (prod) → use as-is
    if pwa_url not in ("http://localhost:5173", "http://127.0.0.1:5173"):
        return {"PWA_URL": pwa_url}
    try:
        raw_host = request.get_host()  # may contain :port
        host = raw_host.split(":")[0].lower()
    except Exception:
        host = ""
        raw_host = ""
    if host in ("localhost", "127.0.0.1", "testserver", ""):
        return {"PWA_URL": pwa_url}
    # Derive PWA host: matamu-dash.* → matamu.* (same nip.io IP)
    if host.startswith("matamu-dash."):
        pwa_host = "matamu." + host[len("matamu-dash."):]
    else:
        pwa_host = host
    # Scheme: prod is always https (nip.io + EC2); local dev keeps http
    if host.endswith(".nip.io") or host.endswith(".compute.amazonaws.com"):
        scheme = "https"
    else:
        # Generic prod host → prefer https if request was https or via proxy
        if request.is_secure() or request.META.get("HTTP_X_FORWARDED_PROTO") == "https":
            scheme = "https"
        elif host.startswith(("192.168.", "10.", "172.")) or host in ("localhost", "127.0.0.1"):
            scheme = request.scheme
        else:
            scheme = "https"  # default prod → https
    pwa_url = f"{scheme}://{pwa_host}"
    return {"PWA_URL": pwa_url}


def admin_stats(request):
    """Counts + recent observations for the admin home dashboard."""
    if not request.path.startswith("/admin/"):
        return {}
    try:
        from observations.models import Observation
        total = Observation.objects.count()
        return {
            "mm_total": total,
            "mm_published": Observation.objects.filter(status="published").count(),
            "mm_pending": Observation.objects.filter(status="pending_verification").count(),
            "mm_resolved": Observation.objects.filter(status="resolved").count(),
            "mm_recent": list(Observation.objects.order_by("-created_at")[:5]),
        }
    except Exception:
        return {}
