from django.conf import settings


def pwa(request):
    """Expose warga PWA URL to all dashboard templates.

    Local:  http://localhost:5173 (PWA dev server)
    Prod EC2: dashboard https://matamu-dash.<ip>.nip.io → PWA https://matamu.<ip>.nip.io
    If PWA_URL env is set to non-localhost, use as-is.
    """
    pwa_url = settings.PWA_URL
    if pwa_url not in ("http://localhost:5173", "http://127.0.0.1:5173"):
        return {"PWA_URL": pwa_url}
    host = request.get_host().split(":")[0].lower()
    if host in ("localhost", "127.0.0.1", "testserver", ""):
        return {"PWA_URL": pwa_url}
    pwa_host = "matamu." + host[len("matamu-dash."):] if host.startswith("matamu-dash.") else host
    return {"PWA_URL": f"https://{pwa_host}"}


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
