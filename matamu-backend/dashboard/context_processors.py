from django.conf import settings


def pwa(request):
    """Expose warga PWA URL to all dashboard templates."""
    return {"PWA_URL": settings.PWA_URL}


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
