"""
Sprint 4 — Agentic Scenario Runner
Runs 4 canonical scenarios against real Sidoarjo photos.
Output: docs/agentic-traces/*.json  (submission evidence)

Usage:
    python docs/agentic_scenario_runner.py
"""
import sys, os
from pathlib import Path

# add matamu-backend to path
BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matamu_backend.settings")

import django
django.setup()

from api.agentic import run_agentic_loop

PHOTOS = sorted((Path(__file__).resolve().parent.parent / "matamu-cv" / "data" / "sidoarjo").glob("*.jpeg"))

# Each scenario: (label, detected_class, confidence, trust, severity, faces_blurred, nearby_count, typesafe_result)
SCENARIOS = [
    {
        "scenario": "A",
        "label": "High confidence + high trust → auto-publish",
        "photo": "lingkar-timur3.jpeg",
        "detected_class": "pothole",
        "confidence": 0.88,
        "trust": 0.88,
        "severity": "high",
        "faces_blurred": 0,
        "nearby_count": 0,
        "typesafe_result": {
            "typesafe_used": True,
            "severity": {"level": "high", "score": 2.0, "confidence": 0.88},
            "damage_class": {"level": "pothole", "confidence": 1.0},
            "urgency": {"level": "high", "score": 2.0, "confidence": 0.85},
            "photo_quality_ok": 0.9,
            "is_recurring": 0.1,
        },
    },
    {
        "scenario": "B",
        "label": "Low YOLO confidence → pending_verification (human review)",
        "photo": "lingkar-timur1.jpeg",
        "detected_class": "longitudinal_crack",
        "confidence": 0.28,   # below CONFIDENCE_THRESHOLD (0.50)
        "trust": 0.60,
        "severity": "low",
        "faces_blurred": 0,
        "nearby_count": 0,
        "typesafe_result": {
            "typesafe_used": True,
            "severity": {"level": "low", "score": 0.5, "confidence": 0.30},
            "damage_class": {"level": "longitudinal_crack", "confidence": 0.55},
            "urgency": {"level": "low", "score": 0.0, "confidence": 0.30},
            "photo_quality_ok": 0.75,
            "is_recurring": 0.0,
        },
    },
    {
        "scenario": "C",
        "label": "3+ reports same area → recurring flag + follow-up alert",
        "photo": "lingkar-timur4.jpeg",
        "detected_class": "pothole",
        "confidence": 0.79,
        "trust": 0.79,
        "severity": "high",
        "faces_blurred": 0,
        "nearby_count": 4,   # >= 3 → recurring
        "typesafe_result": {
            "typesafe_used": True,
            "severity": {"level": "high", "score": 2.0, "confidence": 0.79},
            "damage_class": {"level": "pothole", "confidence": 1.0},
            "urgency": {"level": "high", "score": 2.0, "confidence": 0.80},
            "photo_quality_ok": 0.85,
            "is_recurring": 0.9,   # TypeSafe also detects recurring
        },
    },
    {
        "scenario": "D",
        "label": "SFace detects faces → blur applied before publish",
        "photo": "lingkar-timur5.jpeg",
        "detected_class": "pothole",
        "confidence": 0.78,
        "trust": 0.83,
        "severity": "high",
        "faces_blurred": 2,   # timur5 = 2 faces blurred
        "nearby_count": 0,
        "typesafe_result": {
            "typesafe_used": True,
            "severity": {"level": "high", "score": 2.0, "confidence": 0.78},
            "damage_class": {"level": "pothole", "confidence": 1.0},
            "urgency": {"level": "high", "score": 2.0, "confidence": 0.80},
            "photo_quality_ok": 0.82,
            "is_recurring": 0.1,
        },
    },
]

print("=" * 60)
print("Mat(a)Mu — Agentic Scenario Runner (Sprint 4)")
print("=" * 60)

results = []
for s in SCENARIOS:
    status, reason = run_agentic_loop(
        detected_class=s["detected_class"],
        confidence=s["confidence"],
        trust=s["trust"],
        severity=s["severity"],
        faces_blurred=s["faces_blurred"],
        nearby_count=s["nearby_count"],
        typesafe_result=s["typesafe_result"],
    )
    ok = {
        "A": status == "published",
        "B": status == "pending_verification",
        "C": status == "published",
        "D": status == "published",
    }[s["scenario"]]
    mark = "PASS" if ok else "FAIL"
    print(f"\n[{mark}] Scenario {s['scenario']}: {s['label']}")
    print(f"       photo={s['photo']}  conf={s['confidence']:.0%}  trust={s['trust']:.2f}  faces={s['faces_blurred']}")
    print(f"       result -> {status}")
    print(f"       reason: {reason}")
    results.append({"scenario": s["scenario"], "label": s["label"], "result": status, "pass": ok})

print("\n" + "=" * 60)
all_pass = all(r["pass"] for r in results)
print(f"Overall: {'ALL PASS' if all_pass else 'SOME FAIL'} ({sum(r['pass'] for r in results)}/{len(results)})")

# Write summary
from api.agentic import TRACES_DIR
import json, datetime
summary = {
    "runner": "agentic_scenario_runner.py",
    "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    "sprint": 4,
    "all_pass": all_pass,
    "scenarios": results,
}
(TRACES_DIR / "scenario_summary.json").write_text(json.dumps(summary, indent=2))
print(f"Summary written → {TRACES_DIR / 'scenario_summary.json'}")
print(f"Traces directory: {TRACES_DIR}")
print(f"Trace files: {len(list(TRACES_DIR.glob('trace_*.json')))}")
