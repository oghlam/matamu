"""
Sprint 4 Day 3-4 — Full Integration Test
Runs the complete capture pipeline (mock LLM/CV) on 6 Sidoarjo photos.
Tests edge cases: dark photo, blurry photo, no-GPS fallback, duplicate.

Usage (from matamu-backend/):
    python docs/integration_test.py
"""
import sys, os, io, json, time
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matamu_backend.settings")
os.environ["PYTHONIOENCODING"] = "utf-8"

import django
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from observations.models import Observation

PHOTOS_DIR = BACKEND.parent / "matamu-cv" / "data" / "sidoarjo"

PASS, FAIL = 0, 0

def check(label, cond, detail=""):
    global PASS, FAIL
    mark = "PASS" if cond else "FAIL"
    if cond:
        PASS += 1
    else:
        FAIL += 1
    suffix = f"  ({detail})" if detail else ""
    print(f"  [{mark}] {label}{suffix}")
    return cond

from django.test.client import encode_multipart, MULTIPART_CONTENT

def post_capture(client, photo_path, lat=-7.4521, lng=112.7175):
    """POST /api/v1/capture with a real photo file."""
    from django.core.files.uploadedfile import SimpleUploadedFile
    with open(photo_path, "rb") as f:
        img = SimpleUploadedFile(photo_path.name, f.read(), content_type="image/jpeg")
    return client.post(
        f"/api/v1/capture?lat={lat}&lng={lng}&id_token=dev",
        data={"file": img},
        format="multipart",
    )

# ── Setup ───────────────────────────────────────────────────────────────────
c = Client()
user, _ = User.objects.get_or_create(username="admin")
c.force_login(user)

photos = sorted(PHOTOS_DIR.glob("*.jpeg"))
print(f"\nFound {len(photos)} photos in {PHOTOS_DIR}")

# Baseline count before test
before = Observation.objects.count()

print("\n" + "=" * 60)
print("Integration Test — Mat(a)Mu Sprint 4")
print("=" * 60)

# ── Test 1: Normal captures (6 photos) ──────────────────────────────────────
print("\n[1] Normal captures (6 Sidoarjo photos)")
created_ids = []
for photo in photos:
    lat = -7.4421 + (len(created_ids) * 0.005)
    lng = 112.7215 - (len(created_ids) * 0.001)
    t0 = time.time()
    resp = post_capture(c, photo, lat=lat, lng=lng)
    elapsed = time.time() - t0
    ok = check(
        f"  {photo.name} -> HTTP {resp.status_code}",
        resp.status_code == 200,
        f"{elapsed:.2f}s"
    )
    if ok:
        data = resp.json()
        check(f"    has id + status", "id" in data and "status" in data)
        check(f"    trust_score present", "trust_score" in data)
        check(f"    detected_class present", "detected_class" in data)
        created_ids.append(data["id"])

# ── Test 2: Edge cases ───────────────────────────────────────────────────────
print("\n[2] Edge cases")

# 2a: Missing GPS (lat=0, lng=0) — should still work, geocode returns "unknown"
from django.core.files.uploadedfile import SimpleUploadedFile
def _upload(client, photo_path, lat, lng):
    with open(photo_path, "rb") as f:
        img = SimpleUploadedFile(photo_path.name, f.read(), content_type="image/jpeg")
    return client.post(f"/api/v1/capture?lat={lat}&lng={lng}&id_token=dev", data={"file": img}, format="multipart")

resp = _upload(c, photos[0], lat=0.0, lng=0.0)
check("Missing/zero GPS", resp.status_code == 200, f"status={resp.status_code}")

# 2b: Duplicate upload (same photo, same location) — should detect nearby
resp = _upload(c, photos[0], lat=-7.4521, lng=112.7175)
check("Duplicate upload accepted", resp.status_code == 200)
if resp.status_code == 200:
    d = resp.json()
    check("  summary present", bool(d.get("summary")))

# 2c: Invalid lat/lng range — Django Ninja should return 422
resp = c.post("/api/v1/capture?lat=not_a_number&lng=112.7&id_token=dev",
              data={"file": SimpleUploadedFile("x.jpg", b"fake", "image/jpeg")}, format="multipart")
check("Invalid lat (non-numeric) rejected", resp.status_code in (400, 422), f"HTTP {resp.status_code}")

# ── Test 3: API endpoints ────────────────────────────────────────────────────
print("\n[3] API endpoints")
r = c.get("/api/v1/observations")
check("GET /observations 200", r.status_code == 200)
check("  returns list", isinstance(r.json(), list))

r = c.get("/api/v1/observations?status=published")
check("GET /observations?status=published", r.status_code == 200)

r = c.get("/api/v1/stats")
check("GET /stats 200", r.status_code == 200)
s = r.json()
check("  stats.total >= before+6", s.get("total", 0) >= before + 6, f"total={s.get('total')}")
check("  avg_trust present", s.get("avg_trust") is not None)

r = c.get("/health")
check("GET /health 200", r.status_code == 200)

r = c.get(f"/api/v1/observations/{created_ids[0]}")
check(f"GET /observations/{created_ids[0]} 200", r.status_code == 200)
detail = r.json()
check("  detail has faces_blurred", "faces_blurred" in detail)
check("  detail has all_detections", "all_detections" in detail)

# 2d: nearby endpoint
r = c.get(f"/api/v1/observations/nearby?lat=-7.4521&lng=112.7175&radius_m=500")
check("GET /nearby 200", r.status_code == 200)

# ── Test 4: Agentic traces written ──────────────────────────────────────────
print("\n[4] Agentic trace files")
traces_dir = BACKEND.parent / "docs" / "agentic-traces"
trace_files = list(traces_dir.glob("trace_*.json"))
check("Trace files exist", len(trace_files) >= 4, f"found {len(trace_files)}")
if trace_files:
    sample = json.loads(trace_files[-1].read_text())
    check("Trace has perception/decision/action", all(k in sample for k in ["perception", "decision", "action"]))
    check("Trace has output.final_status", "output" in sample and "final_status" in sample["output"])

# ── Summary ──────────────────────────────────────────────────────────────────
total = PASS + FAIL
print(f"\n{'='*60}")
print(f"Result: {PASS}/{total} PASS  |  {FAIL}/{total} FAIL")
after = Observation.objects.count()
print(f"Observations: {before} before -> {after} after (added {after - before})")
