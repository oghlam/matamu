"""Mat(a)Mu API — Django Ninja endpoints."""
import logging
import tempfile
import os
from pathlib import Path
from typing import Optional

from ninja import NinjaAPI, UploadedFile, File
from django.utils import timezone
from observations.models import Observation, FollowUp

from .cv_pipeline import run_cv, blur_faces_for
from .storage import upload_evidence
from .llm import haiku_summary, gemini_severity, haiku_dedup_hint
from .geocoding import reverse_geocode
from .agentic import run_agentic_loop
from .typesafe_eval import evaluate_observation

logger = logging.getLogger(__name__)
api = NinjaAPI(title="Mat(a)Mu API", version="1.0.0", docs_url="/docs")


# ── Health ──────────────────────────────────────────────────────────────────

@api.get("/ping")
def ping(request):
    return {"message": "pong", "service": "matamu"}


# ── Capture ─────────────────────────────────────────────────────────────────

@api.post("/v1/capture")
def capture(request, lat: float, lng: float,
            gps_accuracy: Optional[float] = None,
            file: UploadedFile = File(...)):
    """
    Full pipeline: upload → CV → SFace blur → S3 → Bedrock → Agentic → DB.
    """
    # 1. Save uploaded file to temp
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        for chunk in file.chunks():
            tmp.write(chunk)
        tmp_path = Path(tmp.name)

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

        # 5. Bedrock: severity (Gemini) + summary (Haiku)
        with open(blurred_path, "rb") as f:
            img_bytes = f.read()
        gemini_result = gemini_severity(detected_class, confidence, img_bytes)

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

        # Use TypeSafe severity if available (calibrated), else Gemini
        if ts_result.get("typesafe_used"):
            severity = ts_result["severity"]["level"]
        else:
            severity = gemini_result["severity"]

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
        status = run_agentic_loop(
            detected_class=detected_class,
            confidence=confidence,
            trust=cv_result["trust"],
            severity=severity,
            faces_blurred=faces_blurred,
            nearby_count=nearby_count,
            typesafe_result=ts_result,
        )

        # 9. Persist
        obs = Observation.objects.create(
            lat=lat, lng=lng,
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
        )

        if nearby_count >= 3:
            FollowUp.objects.create(observation=obs, status="recurring_flagged")

        logger.info("capture OK obs=%s class=%s trust=%.2f status=%s", obs.id, detected_class, cv_result["trust"], status)
        return {
            "id": obs.id,
            "status": obs.status,
            "trust_score": obs.trust_score,
            "severity": obs.severity,
            "detected_class": detected_class,
            "confidence": confidence,
            "summary": summary,
            "location": location_label,
            "lat": lat,
            "lng": lng,
            "faces_blurred": faces_blurred,
            "evidence_url": evidence_url,
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
                      severity: str = None, limit: int = 100):
    qs = Observation.objects.all().order_by("-created_at")
    if status:
        qs = qs.filter(status=status)
    if detected_class:
        qs = qs.filter(detected_class=detected_class)
    if severity:
        qs = qs.filter(severity=severity)
    return [_obs_dict(o) for o in qs[:limit]]


@api.get("/v1/observations/{obs_id}")
def get_observation(request, obs_id: int):
    try:
        o = Observation.objects.get(id=obs_id)
        return _obs_dict(o, detail=True)
    except Observation.DoesNotExist:
        return api.create_response(request, {"error": "not found"}, status=404)


@api.get("/v1/observations/nearby")
def nearby(request, lat: float, lng: float, radius_m: float = 50):
    deg = radius_m / 111000
    qs = Observation.objects.filter(
        lat__gte=lat - deg, lat__lte=lat + deg,
        lng__gte=lng - deg, lng__lte=lng + deg,
    )
    return [{"id": o.id, "class": o.detected_class, "lat": o.lat, "lng": o.lng,
             "severity": o.severity, "status": o.status} for o in qs]


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
    return {
        "total": Observation.objects.count(),
        "by_status": list(Observation.objects.values("status").annotate(n=Count("id"))),
        "by_class": list(Observation.objects.values("detected_class").annotate(n=Count("id"))),
        "avg_trust": Observation.objects.aggregate(v=Avg("trust_score"))["v"],
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
        "created_at": o.created_at,
    }
    if detail:
        d["all_detections"] = getattr(o, "all_detections", [])
        d["faces_blurred"] = getattr(o, "faces_blurred", 0)
        d["followups"] = [{"id": f.id, "status": f.status, "created_at": f.created_at}
                          for f in o.followups.all()]
    return d
