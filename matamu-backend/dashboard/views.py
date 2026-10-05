import json
import math
from pathlib import Path

from django.contrib import messages
from django.contrib.auth.decorators import login_required, permission_required
from django.db.models import Avg, Count
from django.http import FileResponse, Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from django.conf import settings

from api.storage import delete_evidence
from observations.models import FollowUp, Observation


def _json_safe(value):
    """Recursively replace NaN/Infinity floats with None (valid JSON).

    Postgres float columns preserve NaN (unlike SQLite, which stores it
    as NULL) — and json.dumps emits a bare NaN token that JSON.parse
    rejects, killing the whole overview map. allow_nan=False below turns
    any future leak into a loud server error instead of a broken page.
    """
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    return value


def _base_stats():
    qs = Observation.objects.all()
    by_status = dict(qs.values_list("status").annotate(n=Count("id")).values_list("status", "n"))
    by_class = list(
        qs.values("detected_class").annotate(n=Count("id")).order_by("-n")
    )
    avg_trust = qs.aggregate(v=Avg("trust_score"))["v"] or 0
    return {
        "total": qs.count(),
        "published": by_status.get("published", 0),
        "pending_verification": by_status.get("pending_verification", 0),
        "acknowledged": by_status.get("acknowledged", 0),
        "resolved": by_status.get("resolved", 0),
        "avg_trust": round(avg_trust, 2),
        "by_class": by_class,
    }


@login_required
def overview(request):
    stats = _base_stats()
    # recent 50 published for map
    map_rows = list(
        Observation.objects.filter(status="published")
        .order_by("-created_at")[:50]
        .values("id", "lat", "lng", "detected_class", "severity",
                "location_label", "trust_score", "confidence", "created_at",
                "evidence_url", "all_detections")
    )
    # JSON-serialize for JS (datetime → isoformat, NaN/Inf → None)
    for r in map_rows:
        if r.get("created_at"):
            r["created_at"] = r["created_at"].isoformat()
    # Dashboard images go through an authenticated Django endpoint instead of
    # the public /media/ alias. This avoids Nginx filesystem permission/alias
    # differences while keeping evidence protected behind dashboard login.
    for r in map_rows:
        if r.get("evidence_url"):
            r["evidence_url"] = f"/dashboard/evidence/{r['id']}/"
    map_rows = _json_safe(map_rows)
    # focus = most recent published WITH valid coords → Location detail card
    # (a NaN-coord row must never become the card: it renders "nan,nan")
    focus_obs = None
    for r in map_rows:
        if r.get("lat") is not None and r.get("lng") is not None:
            focus_obs = Observation.objects.filter(pk=r["id"]).first()
            break
    if focus_obs is None:
        focus_obs = (
            Observation.objects.filter(status="published")
            .order_by("-created_at")
            .first()
        )
    # severity distribution for arc card
    pub = Observation.objects.filter(status="published")
    sev_high = pub.filter(severity__in=["high", "severe", "critical"]).count()
    sev_mid = pub.filter(severity__in=["moderate", "medium"]).count()
    sev_low = pub.filter(severity="low").count()
    # cumulative stops for conic-gradient arc (guard divide-by-zero)
    denom = max(stats["published"], 1)
    arc_high = round(sev_high / denom * 100)
    arc_mid_end = round((sev_high + sev_mid) / denom * 100)
    return render(request, "dashboard/overview.html", {
        "stats": stats,
        "map_obs_json": json.dumps(map_rows, allow_nan=False),
        "focus_obs": focus_obs,
        "sev_high": sev_high,
        "sev_mid": sev_mid,
        "sev_low": sev_low,
        "arc_high": arc_high,
        "arc_mid_end": arc_mid_end,
        "page": "overview",
    })


@login_required
def evidence_image(request, pk):
    """Serve one evidence image to an authenticated dashboard user."""
    obs = get_object_or_404(Observation, pk=pk)
    url = obs.evidence_url or ""
    if url.startswith("http://") or url.startswith("https://"):
        return HttpResponseRedirect(url)
    if not url.startswith("/media/"):
        raise Http404("Evidence is not stored locally")

    root = Path(settings.MEDIA_ROOT).resolve()
    image_path = (root / url.removeprefix("/media/")).resolve()
    if root not in image_path.parents or not image_path.is_file():
        raise Http404("Evidence image not found")
    return FileResponse(image_path.open("rb"), content_type="image/jpeg")


@login_required
def observations(request):
    from django.core.paginator import Paginator
    qs = Observation.objects.order_by("-created_at")
    status_f = request.GET.get("status", "")
    severity_f = request.GET.get("severity", "")
    class_f = request.GET.get("cls", "")
    q = request.GET.get("q", "").strip()
    try:
        per_page = int(request.GET.get("per_page", "10"))
    except ValueError:
        per_page = 10
    if per_page not in (10, 25, 50):
        per_page = 10
    if status_f:
        qs = qs.filter(status=status_f)
    if severity_f in ("moderate", "medium"):
        qs = qs.filter(severity__in=["moderate", "medium"])
    elif severity_f:
        qs = qs.filter(severity=severity_f)
    if class_f:
        qs = qs.filter(detected_class=class_f)
    if q:
        qs = qs.filter(location_label__icontains=q)
    paginator = Paginator(qs, per_page)
    page_number = request.GET.get("page", "1")
    page_obj = paginator.get_page(page_number)
    return render(request, "dashboard/observations.html", {
        "observations": page_obj.object_list,
        "page_obj": page_obj,
        "status_f": status_f,
        "severity_f": severity_f,
        "class_f": class_f,
        "q": q,
        "per_page": per_page,
        "page": "observations",
    })


@login_required
@require_POST
@permission_required("observations.delete_observation", raise_exception=True)
def observation_delete(request, pk):
    """Maintenance delete (Supervisor only): DB row + evidence file."""
    obs = get_object_or_404(Observation, pk=pk)
    label = obs.location_label or f"report #{obs.pk}"
    delete_evidence(obs.evidence_url)
    obs.delete()  # FollowUp rows cascade
    messages.success(request, f"Deleted {label} and its photo.")
    return redirect("dashboard:observations")


@login_required
def iqe_queue(request):
    from django.core.paginator import Paginator
    pending_qs = Observation.objects.filter(status="pending_verification").order_by("created_at")
    try:
        per_page = int(request.GET.get("per_page", "10"))
    except ValueError:
        per_page = 10
    if per_page not in (10, 25, 50):
        per_page = 10
    paginator = Paginator(pending_qs, per_page)
    page_obj = paginator.get_page(request.GET.get("page", "1"))
    return render(request, "dashboard/iqe.html", {
        "pending": page_obj.object_list,
        "page_obj": page_obj,
        "per_page": per_page,
        "page": "iqe",
    })


@login_required
@require_POST
@permission_required("observations.can_moderate_iqe", raise_exception=True)
def iqe_action(request, pk):
    obs = get_object_or_404(Observation, pk=pk)
    action = request.POST.get("action")
    if action == "accept":
        obs.status = "published"
    elif action == "reject":
        obs.status = "rejected"
    obs.save(update_fields=["status"])
    return redirect("dashboard:iqe")


@login_required
def followup(request):
    from django.core.paginator import Paginator
    qs = Observation.objects.filter(status__in=["published", "acknowledged"]).order_by("-created_at")
    try:
        per_page = int(request.GET.get("per_page", "10"))
    except ValueError:
        per_page = 10
    if per_page not in (10, 25, 50):
        per_page = 10
    paginator = Paginator(qs, per_page)
    page_obj = paginator.get_page(request.GET.get("page", "1"))
    return render(request, "dashboard/followup.html", {
        "observations": page_obj.object_list,
        "page_obj": page_obj,
        "per_page": per_page,
        "page": "followup",
    })


@login_required
@require_POST
@permission_required("observations.change_observation", raise_exception=True)
def followup_action(request, pk):
    obs = get_object_or_404(Observation, pk=pk)
    action = request.POST.get("action")
    if action == "acknowledge":
        obs.status = "acknowledged"
        obs.save(update_fields=["status"])
        FollowUp.objects.create(observation=obs, status="acknowledged")
    elif action == "resolve":
        obs.status = "resolved"
        obs.save(update_fields=["status"])
        FollowUp.objects.create(observation=obs, status="resolved")
    return redirect("dashboard:followup")


@login_required
def agentic_traces(request):
    from pathlib import Path
    from django.core.paginator import Paginator
    traces_dir = Path(__file__).resolve().parents[2] / "docs" / "agentic-traces"
    if not traces_dir.exists():
        return render(request, "dashboard/agentic.html", {"traces": [], "page_obj": None, "per_page": 10, "page": "agentic"})
    trace_files = sorted(traces_dir.glob("trace_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    traces = []
    for f in trace_files:  # all, paginator will limit
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            traces.append({
                "filename": f.name,
                "timestamp": data.get("timestamp", ""),
                "detected_class": data.get("input", {}).get("detected_class", ""),
                "confidence": data.get("input", {}).get("confidence", 0),
                "final_status": data.get("output", {}).get("final_status", ""),
                "decision_reason": data.get("decision", {}).get("reason", ""),
                "routing": data.get("decision", {}).get("routing", ""),
                "actions": data.get("action", {}).get("actions", []),
            })
        except Exception:
            pass
    try:
        per_page = int(request.GET.get("per_page", "10"))
    except ValueError:
        per_page = 10
    if per_page not in (10, 25, 50):
        per_page = 10
    paginator = Paginator(traces, per_page)
    page_obj = paginator.get_page(request.GET.get("page", "1"))
    return render(request, "dashboard/agentic.html", {"traces": page_obj.object_list, "page_obj": page_obj, "per_page": per_page, "page": "agentic"})
