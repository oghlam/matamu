"""TypeSafe AI (Jev) — structured decision engine for observation evaluation.

Sends YOLO detection results as state, asks 5 parallel questions in 1 request:
  - severity_score: Score (minor → critical)
  - damage_class: Choice (pothole, crack types, flooding, etc.)
  - urgency: Score (low → emergency)
  - photo_quality: Noul (is the photo clear enough?)
  - is_recurring: Noul (does this look like an ongoing issue?)

Returns typed answers with calibrated probabilities + confidence.
Used by agentic.py for confidence-gated routing.

ponytail: fallback to heuristic dict if TYPESAFE_API_KEY not set.
"""
import os
import logging
import json

logger = logging.getLogger("matamu.typesafe")

TYPESAFE_API_KEY = os.getenv("TYPESAFE_API_KEY", "")


def evaluate_observation(
    detected_class: str,
    confidence: float,
    trust_score: float,
    blur_score: float,
    brightness: float,
    nearby_count: int,
    num_detections: int,
) -> dict:
    """Run TypeSafe evaluation on observation data.

    Returns:
        {
            "severity": {"score": float, "confidence": float, "level": str},
            "damage_class": {"choice": str, "confidence": float, "probabilities": dict},
            "urgency": {"score": float, "confidence": float, "level": str},
            "photo_quality_ok": float,  # noul 0-1
            "is_recurring": float,      # noul 0-1
            "typesafe_used": bool,
        }
    """
    if not TYPESAFE_API_KEY:
        return _heuristic_fallback(detected_class, confidence, trust_score, nearby_count)

    try:
        from typesafe_sdk import TypeSafeClient, Choice, Score, Noul

        state = {
            "detection": {
                "class": detected_class,
                "confidence": round(confidence, 3),
                "num_detections": num_detections,
            },
            "quality": {
                "trust_score": round(trust_score, 3),
                "blur_score": round(blur_score, 1),
                "brightness": round(brightness, 1),
            },
            "context": {
                "nearby_reports": nearby_count,
            },
        }

        with TypeSafeClient(api_key=TYPESAFE_API_KEY) as client:
            response = client.system_one(
                state=state,
                questions={
                    "severity_score": Score(
                        instructions="How severe is the road damage described in `detection`?",
                        criteria=[
                            "Minor: cosmetic damage, no safety risk, e.g. hairline cracks",
                            "Moderate: visible damage, minor safety risk, e.g. small pothole or crack pattern",
                            "Severe: significant damage, clear safety risk, e.g. large pothole or extensive cracking",
                            "Critical: dangerous condition, immediate safety hazard, e.g. deep pothole or road collapse",
                        ],
                    ),
                    "damage_class": Choice(
                        instructions="What type of road damage does `detection.class` most likely represent, given `detection.confidence`?",
                        criteria={
                            "pothole": "A hole or depression in the road surface",
                            "longitudinal_crack": "Crack running along the road direction",
                            "alligator_crack": "Network of interconnected cracks resembling alligator skin",
                            "rutting": "Depression or groove worn into the road by wheels",
                            "flooding": "Standing water or flood damage on road surface",
                            "surface_degradation": "General surface wear, raveling, or loss of material",
                        },
                    ),
                    "urgency": Score(
                        instructions="How urgently should this road condition be addressed, considering `detection.confidence`, `quality.trust_score`, and `context.nearby_reports`?",
                        criteria=[
                            "Low: can be scheduled for routine maintenance",
                            "Medium: should be addressed within weeks",
                            "High: should be addressed within days",
                            "Emergency: needs immediate attention, safety hazard",
                        ],
                    ),
                    "photo_quality_ok": Noul(
                        instructions="Is the photo quality sufficient for reliable assessment, based on `quality.blur_score` and `quality.brightness`?",
                        criteria={
                            "true": "Image is clear enough for a confident damage assessment",
                            "false": "Image is too blurry, dark, or overexposed for reliable assessment",
                        },
                    ),
                    "is_recurring": Noul(
                        instructions="Does the context suggest this is a recurring or ongoing issue, based on `context.nearby_reports`?",
                        criteria={
                            "true": "Multiple reports in the same area suggest a persistent problem",
                            "false": "This appears to be a new or isolated report",
                        },
                    ),
                },
            )

        answers = response.answers
        severity_levels = ["minor", "moderate", "severe", "critical"]
        urgency_levels = ["low", "medium", "high", "emergency"]

        sev = answers["severity_score"]
        urg = answers["urgency"]
        dmg = answers["damage_class"]

        result = {
            "severity": {
                "score": sev.score,
                "confidence": sev.confidence,
                "level": severity_levels[min(round(sev.score), 3)],
                "probabilities": {severity_levels[int(k)]: v for k, v in sev.probabilities.items()},
            },
            "damage_class": {
                "choice": dmg.choice,
                "confidence": dmg.confidence,
                "probabilities": dict(dmg.probabilities),
            },
            "urgency": {
                "score": urg.score,
                "confidence": urg.confidence,
                "level": urgency_levels[min(round(urg.score), 3)],
                "probabilities": {urgency_levels[int(k)]: v for k, v in urg.probabilities.items()},
            },
            "photo_quality_ok": answers["photo_quality_ok"].noul,
            "is_recurring": answers["is_recurring"].noul,
            "typesafe_used": True,
        }

        logger.info("TYPESAFE_EVAL %s", json.dumps(result, ensure_ascii=False))
        return result

    except Exception as e:
        logger.warning("typesafe_eval failed: %s — using heuristic", e)
        return _heuristic_fallback(detected_class, confidence, trust_score, nearby_count)


def _heuristic_fallback(detected_class: str, confidence: float, trust_score: float, nearby_count: int) -> dict:
    """ponytail: same shape as TypeSafe output, heuristic values."""
    sev_level = "severe" if confidence >= 0.75 else ("moderate" if confidence >= 0.5 else "minor")
    urg_level = "high" if confidence >= 0.75 and nearby_count >= 3 else ("medium" if confidence >= 0.5 else "low")
    return {
        "severity": {"score": confidence * 3, "confidence": 0.0, "level": sev_level, "probabilities": {}},
        "damage_class": {"choice": detected_class, "confidence": 0.0, "probabilities": {}},
        "urgency": {"score": 1.0 if urg_level == "medium" else (2.0 if urg_level == "high" else 0.0), "confidence": 0.0, "level": urg_level, "probabilities": {}},
        "photo_quality_ok": 1.0 if trust_score >= 0.65 else 0.3,
        "is_recurring": 0.9 if nearby_count >= 3 else 0.1,
        "typesafe_used": False,
    }
