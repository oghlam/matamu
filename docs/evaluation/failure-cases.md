# Mat(a)Mu — Failure Cases & Evaluation Evidence

> Sprint 4 Day 6 — Required for OpenCV AI Competition 2026 submission.
> Every failure is documented with: input · expected · actual · root cause · mitigation.

---

## Evaluation Summary (6 Sidoarjo Photos)

| Photo | Trust | Confidence | Severity | Status | Faces Blurred |
|-------|-------|-----------|----------|--------|---------------|
| lingkar-timur1.jpeg | 0.80 | 68% | medium | published | 0 |
| lingkar-timur2.jpeg | 0.70 | 68% | medium | published | 0 |
| lingkar-timur3.jpeg | 0.88 | 77% | high | published | 0 |
| lingkar-timur4.jpeg | 0.79 | 80% | high | published | 0 |
| lingkar-timur5.jpeg | 0.83 | 78% | high | published | 2 |
| lingkar-timur6.jpeg | 0.83 | 81% | high | published | 0 |

**Avg Trust Score: 0.805** · **Damage class confidence: 1.0 (all pothole)** · **Integration test: 46/46 PASS**

---

## Failure Case 1: False Positive — Non-pothole Detected as Pothole

| Field | Detail |
|---|---|
| **Input** | Road surface with shadow patterns or paint markings |
| **Expected** | No detection or `surface_degradation` |
| **Actual** | YOLO detects `pothole` with confidence ~0.30–0.45 |
| **Root cause** | YOLOv11n trained on RDD dataset (Japan/India roads) — shadow/paint patterns can trigger false pothole class |
| **Mitigation** | IQE trust score penalizes low-confidence detections; TypeSafe confidence gate < 0.40 → `pending_verification` for human review |
| **Evidence** | Scenario B trace: `trace_*_pending_verification.json` — low conf (28%) correctly routed to pending |

---

## Failure Case 2: False Negative — Pothole Missed by YOLO

| Field | Detail |
|---|---|
| **Input** | Pothole at image edge, partially occluded, or very small |
| **Expected** | `pothole` detected |
| **Actual** | Empty detections → falls back to `unknown` class with conf 0.0 |
| **Root cause** | YOLOv11n (nano) trades recall for speed; edge objects and very small defects are missed |
| **Mitigation** | CV pipeline mock result returns `confidence=0.70` → `pending_verification` on real miss (agentic gate B). In production: use YOLOv11s (small) or ensemble. |

---

## Failure Case 3: Low-light / Dark Photo

| Field | Detail |
|---|---|
| **Input** | Photo taken at night or in heavy shadow (brightness < 40) |
| **Expected** | Detection or graceful degradation |
| **Actual** | IQE brightness score low → trust score drops → `pending_verification` |
| **Root cause** | Laplacian blur + brightness are inputs to IQE trust. Night photos score < 0.40 brightness → trust penalty |
| **Mitigation** | IQE correctly routes low-quality photos to human review queue. Operator can accept/reject via IQE dashboard. |
| **Design decision** | This is **intentional** — dark photos should not auto-publish. Privacy + accuracy tradeoff. |

---

## Failure Case 4: GPS Inaccuracy / Missing GPS

| Field | Detail |
|---|---|
| **Input** | `lat=0, lng=0` (GPS unavailable) or high gps_accuracy (> 50m) |
| **Expected** | Graceful handling, photo still processed |
| **Actual** | Pipeline continues; `reverse_geocode(0, 0)` returns "0°0'0\"N 0°0'0\"E" or similar |
| **Root cause** | No GPS validation in capture endpoint |
| **Mitigation** | Added `gps_accuracy` optional param; display `location_label = "GPS unavailable"` if lat/lng = 0. Integration test confirmed HTTP 200 with `lat=0,lng=0`. |
| **Improvement** | The citizen PWA shows a GPS accuracy warning; operators can see coordinates in the dashboard. |

---

## Failure Case 5: Bedrock / LiteLLM API Timeout

| Field | Detail |
|---|---|
| **Input** | `LITELLM_BASE_URL` set but EC2 unreachable or API timeout |
| **Expected** | Graceful fallback |
| **Actual** | `haiku_summary` returns mock: `"Detected {class} with {conf}% confidence, {severity} severity."` |
| **Root cause** | EC2 not yet active (waiting for 90% completion); LiteLLM proxy not running locally |
| **Mitigation** | All LLM calls wrapped in try/except with mock fallback. `LITELLM_BASE_URL=""` → instant mock (no timeout). Tested: 46/46 integration test passes without LLM. |
| **Evidence** | `api/llm.py` lines 29–49: mock fallback present for all 3 functions. |

---

## Failure Case 6: SFace False Blur (Non-face Blurred)

| Field | Detail |
|---|---|
| **Input** | Road surface with round manhole covers, circular signs, or similar patterns |
| **Expected** | No blur applied |
| **Actual** | YuNet may detect circular patterns as faces at low threshold |
| **Root cause** | YuNet face detector uses score threshold 0.6 in our implementation; lower = more false positives |
| **Mitigation** | Conservative threshold (0.6) already reduces false positives. Even if a small area is blurred, evidence integrity is maintained. Tradeoff documented here. |
| **Evidence** | `lingkar-timur5.jpeg`: 2 faces correctly blurred (pedestrians visible). 5 other photos: 0 false blurs. |

---

## Failure Case 7: Duplicate / Recurring Reports

| Field | Detail |
|---|---|
| **Input** | Same road damage reported by multiple users within 50m radius |
| **Expected** | Flagged as recurring, operator alerted |
| **Actual (correct)** | `nearby_count >= 3` → `recurring_followup_created` action in agentic loop |
| **Edge case** | First 2 reports not yet flagged (threshold not reached) |
| **Mitigation** | Threshold is configurable (`CONFIDENCE_THRESHOLD` in `agentic.py`). Current: 3+ reports. Operator can manually follow up via dashboard. |
| **Evidence** | Scenario C trace: `trace_*_published.json` with `"recurring_followup_created"` in actions. |

---

## Responsible AI Properties

| Property | Implementation |
|---|---|
| **Privacy** | SFace (YuNet) blurs all detected faces before S3 upload. Evidence URL → blurred version only. |
| **Human oversight** | IQE queue in operator dashboard. All pending_verification cases require human accept/reject. |
| **Explainability** | Every observation has `summary` (Haiku), `typesafe_eval` JSON (5 questions + confidence), agentic trace JSON. |
| **Auditability** | Full trace logged per observation: `docs/agentic-traces/*.json`. |
| **Transparency** | Low-confidence detections never auto-publish. Confidence gates documented and configurable. |

---

## Benchmark Summary

| Metric | Value |
|---|---|
| Integration test pass rate | 46/46 (100%) |
| Agentic scenario pass rate | 4/4 (100%) |
| Avg trust score (6 photos) | 0.805 |
| Avg latency (mock mode) | ~2s per capture |
| Faces correctly blurred | 2/2 detected faces |
| False blurs (6 photos) | 0 |
| False positives observed | 0 (all 6 photos correctly `pothole`) |
| Rate limit | 10 req/min/IP |
