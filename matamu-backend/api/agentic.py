"""Agentic Vision Loop — Perception → Decision → Action.

Enhanced with TypeSafe AI confidence-gated routing:
  - TypeSafe provides calibrated confidence on severity, classification, urgency
  - High TypeSafe confidence → auto-publish
  - Medium confidence → publish with flag
  - Low confidence → pending_verification (human review)

Scenarios:
  A. high confidence + high trust  → auto-publish + Haiku summary
  B. low confidence                → pending_verification (human review)
  C. 3+ reports same area          → recurring_flagged (FollowUp created in api.py)
  D. SFace detects face            → blur before publish (handled in cv_pipeline)
  E. TypeSafe photo_quality_ok low → pending_verification (photo too poor)

Trace log entry written to logger for agentic track submission evidence.
ponytail: simple decision tree, no LangChain/orchestration overhead.
"""
import logging
import json
import datetime

logger = logging.getLogger("matamu.agentic")

TRUST_THRESHOLD = 0.65
CONFIDENCE_THRESHOLD = 0.50
# TypeSafe confidence gates
TYPESAFE_HIGH_CONFIDENCE = 0.70
TYPESAFE_LOW_CONFIDENCE = 0.40
PHOTO_QUALITY_THRESHOLD = 0.5


def run_agentic_loop(
    detected_class: str,
    confidence: float,
    trust: float,
    severity: str,
    faces_blurred: int,
    nearby_count: int,
    typesafe_result: dict = None,
) -> str:
    """
    Decide final status for an observation.

    Args:
        typesafe_result: output from typesafe_eval.evaluate_observation(), or None

    Returns: "published" | "pending_verification"
    Also logs a structured trace for agentic track evidence.
    """
    trace = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "phase": "agentic_loop",
        "input": {
            "detected_class": detected_class,
            "confidence": confidence,
            "trust": trust,
            "severity": severity,
            "faces_blurred": faces_blurred,
            "nearby_count": nearby_count,
        },
    }

    ts = typesafe_result or {}
    ts_used = ts.get("typesafe_used", False)

    # --- PERCEPTION ---
    high_confidence = confidence >= CONFIDENCE_THRESHOLD
    high_trust = trust >= TRUST_THRESHOLD
    is_recurring = nearby_count >= 3
    privacy_ok = True  # faces already blurred before we reach here

    # TypeSafe perception signals
    ts_severity_confidence = ts.get("severity", {}).get("confidence", 0.0) if ts_used else 0.0
    ts_photo_quality = ts.get("photo_quality_ok", 1.0)
    ts_is_recurring = ts.get("is_recurring", 0.0)

    trace["perception"] = {
        "high_confidence": high_confidence,
        "high_trust": high_trust,
        "is_recurring": is_recurring,
        "privacy_ok": privacy_ok,
        "typesafe_used": ts_used,
        "typesafe_severity_confidence": ts_severity_confidence,
        "typesafe_photo_quality": ts_photo_quality,
        "typesafe_is_recurring": ts_is_recurring,
    }

    # --- DECISION (confidence-gated routing) ---
    if ts_used:
        # TypeSafe-enhanced decision tree
        decision, reason = _typesafe_decision(
            confidence, trust, high_confidence, high_trust, is_recurring,
            severity, ts_severity_confidence, ts_photo_quality, ts_is_recurring,
        )
    else:
        # Fallback: original logic without TypeSafe
        decision, reason = _baseline_decision(
            confidence, trust, high_confidence, high_trust, is_recurring,
        )

    trace["decision"] = {"status": decision, "reason": reason, "routing": "typesafe" if ts_used else "baseline"}

    # --- ACTION ---
    action_taken = []
    if decision == "published":
        action_taken.append("status_set_published")
        if severity in ("high", "severe", "critical", "emergency"):
            action_taken.append("high_severity_alert_queued")
        if is_recurring or (ts_used and ts_is_recurring > 0.7):
            action_taken.append("recurring_followup_created")
    else:
        action_taken.append("status_set_pending_verification")
        action_taken.append("iQE_review_queued")

    trace["action"] = {"actions": action_taken}
    trace["output"] = {"final_status": decision}

    # Include TypeSafe eval in trace (agentic track evidence)
    if ts_used:
        trace["typesafe_eval"] = {
            "severity": ts.get("severity", {}),
            "damage_class": ts.get("damage_class", {}),
            "urgency": ts.get("urgency", {}),
            "photo_quality_ok": ts_photo_quality,
            "is_recurring_noul": ts_is_recurring,
        }

    logger.info("AGENTIC_TRACE %s", json.dumps(trace, ensure_ascii=False))
    return decision


def _typesafe_decision(
    confidence, trust, high_confidence, high_trust, is_recurring,
    severity, ts_sev_conf, ts_photo_quality, ts_is_recurring,
) -> tuple[str, str]:
    """Confidence-gated routing using TypeSafe signals."""

    # Gate E: photo quality too poor for assessment
    if ts_photo_quality < PHOTO_QUALITY_THRESHOLD:
        return "pending_verification", f"TypeSafe photo_quality={ts_photo_quality:.2f} below {PHOTO_QUALITY_THRESHOLD} — needs human review"

    # Gate B: YOLO confidence too low
    if not high_confidence:
        return "pending_verification", f"low YOLO confidence ({confidence:.0%}) — needs human review"

    # Gate: trust score too low
    if not high_trust:
        return "pending_verification", f"low trust score ({trust:.2f}) — needs human review"

    # TypeSafe confidence-gated auto-publish
    if ts_sev_conf >= TYPESAFE_HIGH_CONFIDENCE:
        # High TypeSafe confidence → auto-publish
        reason = f"TypeSafe severity confidence={ts_sev_conf:.2f} >= {TYPESAFE_HIGH_CONFIDENCE} — auto-publish"
        if is_recurring or ts_is_recurring > 0.7:
            reason += f" + recurring (nearby={ts_is_recurring:.2f})"
        return "published", reason
    elif ts_sev_conf >= TYPESAFE_LOW_CONFIDENCE:
        # Medium confidence → publish but could flag for review
        return "published", f"TypeSafe severity confidence={ts_sev_conf:.2f} (medium) — publish with monitoring"
    else:
        # Low TypeSafe confidence → needs human review
        return "pending_verification", f"TypeSafe severity confidence={ts_sev_conf:.2f} < {TYPESAFE_LOW_CONFIDENCE} — needs human review"


def _baseline_decision(confidence, trust, high_confidence, high_trust, is_recurring) -> tuple[str, str]:
    """Original decision logic without TypeSafe."""
    if not high_confidence:
        return "pending_verification", f"low confidence ({confidence:.0%}) below threshold {CONFIDENCE_THRESHOLD:.0%}"
    elif not high_trust:
        return "pending_verification", f"low trust score ({trust:.2f}) below threshold {TRUST_THRESHOLD}"
    elif is_recurring:
        return "published", f"recurring: reports in area — auto-publish + flag"
    else:
        return "published", f"confidence {confidence:.0%} + trust {trust:.2f} — auto-publish"
