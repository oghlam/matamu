# Mat(a)Mu — Technical Report (Draft)

> OpenCV AI Competition 2026 · Blaz Labs
> Team: Blaz Labs · Location: Sidoarjo, East Java, Indonesia

---

## 1. Problem & Users

Road infrastructure in Indonesia deteriorates faster than it can be repaired. Manual inspection is slow, expensive, and relies on reactive reporting. Citizens have no easy way to report damage; road authorities have no systematic way to collect, verify, and prioritize reports.

**Mat(a)Mu** (Mata Jalan Masyarakat — "Community Road Eye") addresses this:

- **Citizens**: capture road damage with a mobile PWA (photo + GPS, one tap)
- **Operators (Road Authority)**: review verified reports on a spatial dashboard, prioritize by severity and trust score, trigger follow-up actions

---

## 2. Architecture

See `docs/architecture/system-architecture.md` for full diagram.

**Stack:**
- Backend: Django 5 + Django Ninja (REST API)
- CV: OpenCV 5 + YOLOv11n (ONNX) + SFace (YuNet) + IQE
- LLM: Amazon Nova Lite (summary) + Amazon Nova Pro (severity) via LiteLLM/Bedrock
- TypeSafe AI: 5-question structured evaluation (confidence-gated routing)
- Storage: PostgreSQL 16 + PostGIS (geo queries) + AWS S3 (evidence)
- Frontend: React + Vite PWA (citizen) + Django template dashboard (operator)

---

## 3. OpenCV 5 Implementation (Substantive Usage)

### 3.1 Object Detection via DNN Module

```python
# cv2.dnn.readNetFromONNX — load YOLOv11n ONNX (36MB)
net = cv2.dnn.readNetFromONNX(model_path)
blob = cv2.dnn.blobFromImage(img, 1/255.0, (640, 640), swapRB=True)
net.setInput(blob)
outputs = net.forward()
```

Classes detected: `pothole`, `longitudinal_crack`, `alligator_crack`, `rutting`, `flooding`, `surface_degradation`

### 3.2 Privacy Blur — SFace (YuNet Face Detector)

```python
detector = cv2.FaceDetectorYN.create(yunet_path, "", (w, h), score_threshold=0.6)
_, faces = detector.detect(img)
for det in faces:
    x, y, ww, hh = map(int, det[:4])
    roi = img[y:y2, x:x2]
    k = max(15, (min(ww, hh) // 3) | 1)  # kernel proportional to face size
    img[y:y2, x:x2] = cv2.GaussianBlur(roi, (k, k), 0)
```

**Privacy guarantee**: evidence URL points to blurred image only; original deleted immediately.

### 3.3 IQE — Inspection Quality Engine

```python
# Blur quality (Laplacian variance)
blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

# Brightness (mean pixel)
brightness = img.mean()

# Trust Score (weighted composite)
trust = 0.4 * detection_confidence + 0.35 * blur_factor + 0.25 * brightness_factor
```

Trust score range 0–1. Threshold 0.65 for auto-publish.

---

## 4. Agentic Vision Loop

See `docs/architecture/agentic-flow.md` for full diagram.

**Perception → Decision → Action:**

1. Perception: YOLO detection + IQE trust + SFace privacy + TypeSafe AI 5-question eval + PostGIS nearby count
2. Decision: confidence-gated routing (5 gates: photo quality, YOLO confidence, trust score, TypeSafe severity confidence)
3. Action: auto-publish OR pending_verification + agentic trace JSON

**Scenario test results: 4/4 PASS** (see `docs/agentic-traces/scenario_summary.json`)

### Evidence Integrity: GPS Watermark

**Challenge:** Mobile OS (Android/iOS) strip EXIF GPS metadata from photos selected via file picker (privacy protection). This broke location verification for citizen reports.

**Solution:** Visual GPS watermark badge baked into photo via HTML5 Canvas before submission:
- **Position:** Bottom-center (12px margin), does not obstruct defect detection area
- **Content:** GPS coordinates + timestamp (e.g., `GPS: -7.433355, 112.731781 | 2026-10-01 15:22:33`)
- **Style:** Semi-transparent dark background, white text (JetBrains Mono)
- **Implementation:** `applyGpsWatermark()` composites badge onto original image, exports JPEG blob
- **Benefit:** Coordinates visible in photo itself (immune to metadata stripping), transparent to operators/jury

All submissions now use **live GPS + watermark** (desktop & mobile uniform behavior). EXIF check retained for optional backend validation.

---

## 5. AWS Deployment

| Service | Usage |
|---------|-------|
| EC2 t2.small | API + CV pipeline + LiteLLM proxy + PostgreSQL |
| S3 (matamu-evidence) | Blurred evidence photos (30-day lifecycle) |
| Amazon Nova Lite | Road condition summary (English, 1 sentence) |
| IAM (matamu-s3-access) | Least-privilege S3 read/write |

**Note**: The public application is deployed online. Local validation also supports mock fallbacks when the live model proxy is unavailable.

---

## 6. Evaluation

| Metric | Value |
|--------|-------|
| Integration test | 46/46 PASS |
| Agentic scenario | 4/4 PASS |
| Avg trust score (6 photos) | 0.805 |
| Avg latency (mock mode) | ~2s/capture |
| Damage class confidence (TypeSafe) | 1.0 (all 6 photos) |
| Faces correctly blurred | 2/2 |
| False blurs | 0 |

See `docs/evaluation/failure-cases.md` for full failure case documentation.

---

## 7. Limitations & Failure Cases

Summary (full detail in `docs/evaluation/failure-cases.md`):

1. **False positive**: shadow/paint patterns may trigger false pothole — mitigated by TypeSafe confidence gate
2. **False negative**: small/edge potholes missed by YOLOv11n nano — human review via IQE queue
3. **Dark photos**: trust score penalizes low brightness → pending_verification (intentional)
4. **GPS inaccuracy**: pipeline continues; `lat=0,lng=0` handled gracefully
5. **Amazon Nova timeout**: heuristic fallback in all LLM calls, no crash
6. **SFace false blur**: threshold 0.6 conservative; 0 false blurs in 6 photos

---

## 8. Responsible Use

- **Privacy**: SFace blurs faces before publication. Original photos never stored or served.
- **Human oversight**: the IQE queue requires an operator to accept or reject low-trust observations.
- **Explainability**: Nova Lite summary + TypeSafe structured eval + agentic trace per observation.
- **Rate limiting**: 10 captures/min/IP to prevent abuse.
- **Transparency**: all confidence gates documented and configurable.

---

## 9. Build / Deploy / Test Instructions

See `README.md` (root) for full instructions.

**Quick test (local, no EC2):**
```bash
cd matamu-backend
python manage.py migrate
python manage.py runserver 8000
# In another terminal:
python docs/integration_test.py      # 46/46 PASS
python docs/agentic_scenario_runner.py  # 4/4 PASS
```

---

*This is a draft. Sections 4, 5 will be expanded with real EC2 benchmark numbers in Sprint 5.*
