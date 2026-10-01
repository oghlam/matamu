"""Mat(a)Mu API — Django Ninja endpoints."""
import logging
import math
import tempfile
import os
import time
from collections import defaultdict
from pathlib import Path
from typing import Optional

from ninja import NinjaAPI, UploadedFile, File
from django.utils import timezone
from observations.models import Observation, FollowUp

from .cv_pipeline import run_cv, blur_faces_for, get_exif_gps, haversine_km
from .storage import upload_evidence
from .llm import haiku_summary, sonnet_severity, haiku_dedup_hint
# backward compat: gemini_severity alias still available in llm.py
from .geocoding import reverse_geocode
from .agentic import run_agentic_loop
from .typesafe_eval import evaluate_observation
from .auth import verify_google_token, BYPASS_AUTH

logger = logging.getLogger(__name__)
api = NinjaAPI(title="Mat(a)Mu API", version="1.0.0", docs_url="/docs")

# ── Rate limiting (simple in-memory, per IP) ─────────────────────────────────
# ponytail: in-memory is fine for single-process demo; use Redis for multi-worker
_rate_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 10        # requests
RATE_WINDOW = 60.0     # seconds
REPORTER_RATE_LIMIT = 5  # stricter per-reporter limit (anti bot-flooding)

def _check_rate(key: str, limit: int = RATE_LIMIT) -> bool:
    """Return True if request is allowed."""
    now = time.monotonic()
    history = _rate_store[key]
    _rate_store[key] = [t for t in history if now - t < RATE_WINDOW]
    if len(_rate_store[key]) >= limit:
        return False
    _rate_store[key].append(now)
    return True


def _valid_coord(v, lo: float, hi: float) -> bool:
    """Finite number within [lo, hi]. Rejects NaN/Infinity/out-of-range."""
    return isinstance(v, (int, float)) and math.isfinite(v) and lo <= v <= hi


# ── Health ──────────────────────────────────────────────────────────────────

@api.get("/ping")
def ping(request):
    return {"message": "pong", "service": "matamu"}


@api.get("/v1/system-health")
def system_health(request):
    """
    System health metrics — CPU, memory, disk, database, services.
    Used by PowerUp modal to show real-time app health.
    """
    import psutil
    from django.db import connection
    from django.conf import settings
    
    # CPU
    cpu_percent = psutil.cpu_percent(interval=0.1)
    cpu_count = psutil.cpu_count()
    
    # Memory
    mem = psutil.virtual_memory()
    mem_total_gb = mem.total / (1024**3)
    mem_used_gb = mem.used / (1024**3)
    mem_percent = mem.percent
    
    # Disk
    disk = psutil.disk_usage('/')
    disk_total_gb = disk.total / (1024**3)
    disk_used_gb = disk.used / (1024**3)
    disk_percent = disk.percent
    
    # Database
    db_ok = False
    db_latency_ms = None
    try:
        start = time.monotonic()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_latency_ms = round((time.monotonic() - start) * 1000, 1)
        db_ok = True
    except:
        pass
    
    # Observations count
    obs_total = Observation.objects.count()
    obs_published = Observation.objects.filter(status='published').count()
    
    # Service status (simple check: if this endpoint runs, Django is OK)
    django_ok = True
    
    # LLM mock mode
    llm_mock = not bool(os.getenv('LITELLM_BASE_URL'))
    
    # Storage mode
    storage_mode = 'S3' if os.getenv('AWS_ACCESS_KEY_ID') else 'local'
    
    return {
        "status": "healthy" if db_ok and cpu_percent < 90 and mem_percent < 90 and disk_percent < 85 else "degraded",
        "timestamp": timezone.now().isoformat(),
        "cpu": {
            "percent": round(cpu_percent, 1),
            "cores": cpu_count,
            "status": "ok" if cpu_percent < 80 else "warning" if cpu_percent < 90 else "critical"
        },
        "memory": {
            "total_gb": round(mem_total_gb, 2),
            "used_gb": round(mem_used_gb, 2),
            "percent": round(mem_percent, 1),
            "status": "ok" if mem_percent < 75 else "warning" if mem_percent < 90 else "critical"
        },
        "disk": {
            "total_gb": round(disk_total_gb, 2),
            "used_gb": round(disk_used_gb, 2),
            "percent": round(disk_percent, 1),
            "status": "ok" if disk_percent < 70 else "warning" if disk_percent < 85 else "critical"
        },
        "database": {
            "connected": db_ok,
            "latency_ms": db_latency_ms,
            "engine": settings.DATABASES['default']['ENGINE'].split('.')[-1],
            "status": "ok" if db_ok and (db_latency_ms or 0) < 100 else "warning" if db_ok else "critical"
        },
        "services": {
            "django": {"running": django_ok, "status": "ok"},
            "llm": {"mode": "mock" if llm_mock else "live", "status": "ok"},
            "storage": {"mode": storage_mode, "status": "ok"}
        },
        "observations": {
            "total": obs_total,
            "published": obs_published
        }
    }


# ── Capture ─────────────────────────────────────────────────────────────────

@api.post("/v1/capture")
def capture(request, lat: float, lng: float,
            gps_accuracy: Optional[float] = None,
            id_token: Optional[str] = None,
            note: Optional[str] = None,
            file: UploadedFile = File(...)):
    """
    Full pipeline: auth → upload → CV → SFace blur → S3 → Bedrock → Agentic → DB.
    Requires Google sign-in (id_token). Bots without a verified Google
    identity are rejected with 401.
    """
    # 0. GPS sanity gate — before quota, auth, CV, or S3 work. The PWA sends
    # "NaN" when GPS is off; Ninja parses it into float nan, which Postgres
    # stores as NaN and breaks JSON downstream. (0,0) stays allowed (fallback).
    if not (_valid_coord(lat, -90.0, 90.0) and _valid_coord(lng, -180.0, 180.0)):
        return api.create_response(request, {"error": "Invalid GPS coordinates. Enable location services and retry."}, status=400)
    if gps_accuracy is not None and not math.isfinite(gps_accuracy):
        gps_accuracy = None
    ip = request.META.get("REMOTE_ADDR", "unknown")
    if not BYPASS_AUTH and not _check_rate("ip:" + ip):
        return api.create_response(request, {"error": "Rate limit exceeded. Max 10 captures per minute."}, status=429)

    # 0. Reporter identity (Google OAuth) — required
    try:
        reporter_sub, reporter_email, reporter_name = verify_google_token(id_token)
    except ValueError as e:
        return api.create_response(request, {"error": str(e)}, status=401)
    if not BYPASS_AUTH and not _check_rate("reporter:" + reporter_sub, limit=REPORTER_RATE_LIMIT):
        return api.create_response(request, {"error": "Too many reports. Max 5 captures per minute per account."}, status=429)
    # 1. Save uploaded file to temp
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        for chunk in file.chunks():
            tmp.write(chunk)
        tmp_path = Path(tmp.name)

    # 1b. EXIF cross-check: photo-embedded GPS vs claimed position.
    # Uploads taken elsewhere but claimed here are forced to human review.
    exif_flag = ""
    exif_gps = get_exif_gps(tmp_path)
    if exif_gps and abs(lat) + abs(lng) > 0:
        gap = haversine_km(lat, lng, exif_gps[0], exif_gps[1])
        if gap > 0.5:
            exif_flag = f"Photo location (EXIF) is {gap:.1f} km from reported position."
            logger.warning("capture: EXIF mismatch %.1f km (claimed %s,%s vs exif %s,%s)",
                           gap, lat, lng, exif_gps[0], exif_gps[1])

    try:
        # 2. CV pipeline (YOLO + IQE)
        cv_result = run_cv(tmp_path)
        detections = cv_result["detections"]
        top = detections[0] if detections else {"class": "unknown", "confidence": 0.0, "bbox": []}
        detected_class = top["class"]
        confidence = top["confidence"]

        # 3. SFace blur → upload blurred to S3
        blurred_path = tmp_path.parent / f"blurred_{tmp_path.name}"
        faces_blurred = blur_faces_for(tmp_path, blurred_path)
        evidence_url = upload_evidence(blurred_path, prefix="evidence")

        # 4. Geocoding
        location_label = reverse_geocode(lat, lng)

        # 5. Bedrock: severity (Sonnet 4.5) + summary (Haiku 4.5)
        with open(blurred_path, "rb") as f:
            img_bytes = f.read()
        sonnet_result = sonnet_severity(detected_class, confidence, img_bytes)

        # 6. TypeSafe AI: structured severity + classification + urgency + quality
        ts_result = evaluate_observation(
            detected_class=detected_class,
            confidence=confidence,
            trust_score=cv_result["trust"],
            blur_score=cv_result["blur"],
            brightness=cv_result["brightness"],
            nearby_count=0,  # computed below, re-evaluated in agentic
            num_detections=len(detections),
        )

        # Use TypeSafe severity if available (calibrated), else Bedrock Sonnet
        if ts_result.get("typesafe_used"):
            severity = ts_result["severity"]["level"]
        else:
            severity = sonnet_result["severity"]

        summary = haiku_summary(detected_class, confidence, severity, location_label)

        # 7. Nearby count (dedup hint)
        deg = 50 / 111000
        nearby_qs = Observation.objects.filter(
            lat__gte=lat - deg, lat__lte=lat + deg,
            lng__gte=lng - deg, lng__lte=lng + deg,
            detected_class=detected_class,
        )
        nearby_count = nearby_qs.count()
        dedup_hint = haiku_dedup_hint(detected_class, nearby_count, location_label)
        if dedup_hint:
            summary = f"{summary} [{dedup_hint}]"

        # Update TypeSafe recurring signal with actual nearby count
        if nearby_count > 0 and ts_result.get("typesafe_used"):
            ts_result["is_recurring"] = 0.9 if nearby_count >= 3 else ts_result["is_recurring"]

        # 8. Agentic loop (perception → decision → action) with TypeSafe confidence gating
        status, review_reason = run_agentic_loop(
            detected_class=detected_class,
            confidence=confidence,
            trust=cv_result["trust"],
            severity=severity,
            faces_blurred=faces_blurred,
            nearby_count=nearby_count,
            typesafe_result=ts_result,
        )

        # 8b. EXIF mismatch overrides everything → human must verify location
        if exif_flag:
            status = "pending_verification"
            review_reason = (review_reason + " " + exif_flag).strip()

        # 9. Persist (note = free text small note)
        safe_note = (note or "").strip()[:500]
        obs = Observation.objects.create(
            lat=lat, lng=lng,
            gps_accuracy=gps_accuracy,
            detected_class=detected_class,
            confidence=confidence,
            bbox=top["bbox"],
            severity=severity,
            status=status,
            trust_score=cv_result["trust"],
            evidence_url=evidence_url,
            summary=summary,
            location_label=location_label,
            all_detections=detections,
            faces_blurred=faces_blurred,
            typesafe_eval=ts_result if ts_result.get("typesafe_used") else {},
            reporter_sub=reporter_sub,
            reporter_email=reporter_email,
            reporter_name=reporter_name,
            review_reason=review_reason if status == "pending_verification" else "",
            note=safe_note,
        )

        if nearby_count >= 3:
            FollowUp.objects.create(observation=obs, status="recurring_flagged")

        logger.info("capture OK obs=%s class=%s trust=%.2f status=%s reporter=%s note=%s", obs.id, detected_class, cv_result["trust"], status, reporter_email, bool(safe_note))
        return {
            "id": obs.id,
            "status": obs.status,
            "trust_score": obs.trust_score,
            "severity": obs.severity,
            "detected_class": detected_class,
            "confidence": confidence,
            "summary": summary,
            "review_reason": obs.review_reason,
            "reporter_name": reporter_name,
            "location": location_label,
            "lat": lat,
            "lng": lng,
            "faces_blurred": faces_blurred,
            "evidence_url": evidence_url,
            "note": safe_note,
            "typesafe": {
                "used": ts_result.get("typesafe_used", False),
                "severity": ts_result.get("severity", {}),
                "damage_class": ts_result.get("damage_class", {}),
                "urgency": ts_result.get("urgency", {}),
            } if ts_result.get("typesafe_used") else None,
        }

    finally:
        # cleanup temp files
        for p in [tmp_path, blurred_path if 'blurred_path' in dir() else None]:
            if p and Path(p).exists():
                try:
                    os.unlink(p)
                except Exception:
                    pass


# ── Observations ────────────────────────────────────────────────────────────

@api.get("/v1/observations")
def list_observations(request, status: str = None, detected_class: str = None,
                      severity: str = None, limit: int = 100,
                      id_token: str = None):
    qs = Observation.objects.all().order_by("-created_at")
    if status:
        qs = qs.filter(status=status)
    if detected_class:
        qs = qs.filter(detected_class=detected_class)
    if severity:
        qs = qs.filter(severity=severity)
    if id_token:
        # "My reports": only this reporter's observations (401 if token bad)
        try:
            sub, _, _ = verify_google_token(id_token)
        except ValueError as e:
            return api.create_response(request, {"error": str(e)}, status=401)
        qs = qs.filter(reporter_sub=sub)
    return [_obs_dict(o) for o in qs[:limit]]


# ── Auth ────────────────────────────────────────────────────────────────────

from ninja import Schema

class GoogleAuthIn(Schema):
    id_token: str

@api.post("/v1/auth/google")
def auth_google(request, data: GoogleAuthIn):
    """Verify a Google ID token from the PWA. Returns reporter profile."""
    try:
        sub, email, name = verify_google_token(data.id_token)
    except ValueError as e:
        return api.create_response(request, {"error": str(e)}, status=401)
    return {"sub": sub, "email": email, "name": name}


@api.get("/v1/observations/nearby")
def nearby(request, lat: float, lng: float, radius_m: float = 50):
    deg = radius_m / 111000
    qs = Observation.objects.filter(
        lat__gte=lat - deg, lat__lte=lat + deg,
        lng__gte=lng - deg, lng__lte=lng + deg,
    )
    return [{"id": o.id, "class": o.detected_class, "lat": o.lat, "lng": o.lng,
             "severity": o.severity, "status": o.status} for o in qs]


@api.get("/v1/observations/{obs_id}")
def get_observation(request, obs_id: int):
    try:
        o = Observation.objects.get(id=obs_id)
        return _obs_dict(o, detail=True)
    except Observation.DoesNotExist:
        return api.create_response(request, {"error": "not found"}, status=404)


@api.post("/v1/observations/{obs_id}/followup")
def add_followup(request, obs_id: int, status: str):
    try:
        obs = Observation.objects.get(id=obs_id)
    except Observation.DoesNotExist:
        return api.create_response(request, {"error": "not found"}, status=404)
    fu = FollowUp.objects.create(observation=obs, status=status)
    obs.status = status if status in ("acknowledged", "resolved") else obs.status
    obs.save(update_fields=["status"])
    return {"id": fu.id, "observation_id": obs_id, "status": fu.status}


# ── Stats ───────────────────────────────────────────────────────────────────

@api.get("/v1/stats")
def stats(request):
    from django.db.models import Count, Avg
    qs = Observation.objects
    return {
        "total": qs.count(),
        "by_status": list(qs.values("status").annotate(n=Count("id"))),
        "by_class": list(qs.values("detected_class").annotate(n=Count("id"))),
        "avg_trust": qs.aggregate(v=Avg("trust_score"))["v"],
        "published": qs.filter(status="published").count(),
        "pending_verification": qs.filter(status="pending_verification").count(),
        "agentic_traces": len(list((
            __import__("pathlib").Path(__file__).resolve().parents[2] / "docs" / "agentic-traces"
        ).glob("trace_*.json"))),
    }


# ── Helpers ─────────────────────────────────────────────────────────────────

def _obs_dict(o, detail=False):
    d = {
        "id": o.id,
        "class": o.detected_class,
        "lat": o.lat, "lng": o.lng,
        "severity": o.severity,
        "status": o.status,
        "trust_score": o.trust_score,
        "confidence": o.confidence,
        "summary": o.summary,
        "location": getattr(o, "location_label", ""),
        "evidence_url": o.evidence_url,
        "review_reason": getattr(o, "review_reason", ""),
        "reporter_name": getattr(o, "reporter_name", ""),
        "note": getattr(o, "note", ""),
        "created_at": o.created_at,
    }
    if detail:
        d["all_detections"] = getattr(o, "all_detections", [])
        d["faces_blurred"] = getattr(o, "faces_blurred", 0)
        d["followups"] = [{"id": f.id, "status": f.status, "created_at": f.created_at}
                          for f in o.followups.all()]
    return d
