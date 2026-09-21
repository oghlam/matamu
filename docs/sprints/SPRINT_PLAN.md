# Mat(a)Mu — Sprint Plan

> OpenCV AI Competition 2026 · Blaz Labs
> Build Phase: 21 Sep — 26 Oct 2026 (36 days, 5 weeks)
> Final Submission Deadline: 26 October 2026, 23:59 Pacific Time

---

## Tech Stack (Locked)

```
Backend:    Django 5 + Django Ninja (API) + Django Admin (operator dashboard)
Database:   PostgreSQL + PostGIS (via django-contrib-gis)
CV:         OpenCV 5 + YOLOv11n (ONNX) + SFace (privacy blur) + IQE
LLM:        Haiku 4.5 (fast tasks) + Gemini 3.7 Flash (multimodal reasoning + agentic)
Storage:    S3 (evidence media)
Frontend:   React + Vite + Tailwind CSS (PWA — one codebase, mobile + web)
Map:        MapLibre GL JS + OpenStreetMap (base) + Google Maps API (geocoding + satellite)
Voice:      Gemini 3.1 Flash TTS (demo video narration)
Proxy:      LiteLLM (unified access to all models)
```

## Project Structure

```
Mat(a)MU/
├── matamu-backend/       → Django + Django Ninja + Admin (Sprint 2)
├── matamu-cv/            → OpenCV 5 + YOLO + SFace + IQE (Sprint 1)
├── matamu-frontend/      → React + Vite + Tailwind PWA (Sprint 3)
│   ├── / (public map — warga: awareness peta sekitar)
│   ├── /capture (warga: foto + GPS + submit)
│   ├── /my-reports (warga: log laporan saya)
│   └── /admin (operator: full dashboard — login required)
├── docs/sprints/         → Sprint plan + progress
├── Mat_a_Mu_Project_Proposal.pdf
├── Mat_a_Mu_Technical_Sharpening.md
└── Road-Asset-Intelligence-Blueprint/
```

## Two Frontend Experiences (Single PWA Codebase)

### 1. Warga (Mobile-first PWA)
- Capture foto + GPS otomatis
- Log laporan saya (status: pending/published/acknowledged/resolved)
- Peta sekitar (awareness — pin laporan dari warga lain, heatmap, filter)
- No config, no IQE detail, no admin controls

### 2. Operator (Web dashboard — same PWA, /admin route)
- Map widget (all observations, filterable)
- Analytics widget (distributions, trends, avg trust score)
- Alert widget (recurring + high severity queue)
- IQE widget (trust score monitor, accept/reject queue)
- Follow-up manager (acknowledge / resolve actions)
- Django Admin sebagai fallback (built-in, langsung jadi moderation queue)

---

## Timeline Overview

```
Week 0  │ SEP 21-22 │ SETUP     │ Env, repo, infra, dataset baseline
Week 1  │ SEP 23-29 │ SPRINT 1  │ CV Pipeline: OpenCV 5 + YOLO + SFace + IQE
Week 2  │ SEP 30-OCT 6 │ SPRINT 2 │ Backend: Django + Bedrock + Postgres/PostGIS + Agentic
Week 3  │ OCT 7-13  │ SPRINT 3  │ PWA Frontend: warga capture + public map + admin dashboard
Week 4  │ OCT 14-20 │ SPRINT 4  │ Agentic Vision + Integration + Failure cases + Arch diagram
Week 5  │ OCT 21-26 │ SPRINT 5  │ Demo prep + Video + Tech report + Submit
```

**Buffer:** 5 days (OCT 21-26) reserved for submission deliverables — NOT for building features.

---

## What You Need to Prepare (Before Sprint 1 Starts)

### A. Infrastructure Access (this week, Sep 21-22)

| # | Item | Status | Action |
|---|------|--------|--------|
| 1 | EC2 (krusetre) t2.small access | ✅ Have it | SSH key ready, Python 3.12 + venv |
| 2 | Bedrock model access | ✅ Haiku 4.5 available | Confirm API access from EC2 |
| 3 | LiteLLM proxy | ✅ Configured | Verify Gemini 3.7 Flash reachable from EC2 |
| 4 | Google Maps API key | ✅ Have it | Enable Geocoding + Static Maps API |
| 5 | AWS S3 bucket | ⬜ Need to create | matamu-evidence |
| 6 | PostgreSQL + PostGIS | ⬜ Need to set up | On EC2 or RDS |
| 7 | GitHub repo | ⬜ Later | Start local, push Week 2 |

### B. Data (this week, Sep 21-22)

| # | Item | How | Effort |
|---|------|-----|-------|
| 1 | RDD dataset (public) | Download from GitHub/Roboflow (Japan+India road damage) | 1 hour |
| 2 | Pothole dataset (Roboflow) | Download from Roboflow Universe | 30 min |
| 3 | 5-10 foto jalan Sidoarjo | Ambil sendiri di Jalan Lingkar Timur / rute harian | 1 hour |
| 4 | Label foto Sidoarjo | Roboflow — manual bbox + class | 1 hour |

### C. Tools & Accounts

| # | Item | Why |
|---|------|-----|
| 1 | Roboflow account (free) | Dataset management + YOLO export |
| 2 | Ultralytics package | YOLOv11 training + ONNX export |
| 3 | OpenCV 5 (pip) | Core CV pipeline |
| 4 | Node.js 22 + npm | PWA frontend (React + Vite) |
| 5 | Django 5 + Django Ninja | Backend API |
| 6 | MapLibre account (free) | Map tiles |

---

## Sprint Details

### SPRINT 0 — SETUP (Sep 21-22, 2 days)

**Goal:** Working development environment on EC2 + local.

```
Tasks:
├── EC2 (krusetre)
│   ├── Install Python 3.12 + venv
│   ├── Install OpenCV 5 (pip install opencv-python)
│   ├── Install Ultralytics (pip install ultralytics)
│   ├── Install Django 5 + Django Ninja + django-contrib-gis
│   ├── Install psycopg2 + postgis adapter
│   └── Verify Bedrock + LiteLLM API access from EC2
├── Local (laptop)
│   ├── Install Node.js 22 + npm
│   ├── Install Git
│   ├── Create React + Vite + Tailwind project (PWA)
│   └── Install MapLibre GL JS
├── Data
│   ├── Download RDD dataset
│   ├── Download Roboflow pothole dataset
│   ├── Take 5-10 photos of Jalan Lingkar Timur
│   └── Label Sidoarjo photos (manual bbox via Roboflow)
├── S3
│   ├── Create S3 bucket: matamu-evidence
│   └── Set up lifecycle policy (30-day retention)
└── PostgreSQL
    ├── Install Postgres + PostGIS on EC2
    ├── Create database: matamu
    └── Create Django project skeleton + initial migrations
```

**Deliverable:** EC2 accessible, OpenCV 5 imports, Bedrock responds, database connected, PWA skeleton, 5-10 labeled Sidoarjo photos ready.

---

### SPRINT 1 — CV PIPELINE (Sep 23-29, 7 days)

**Goal:** YOLO detects road conditions via OpenCV 5 DNN module. SFace blur works. IQE produces Trust Score.

```
Day 1-2: Model Training
├── Fine-tune YOLOv11n on RDD dataset (transfer learning, Google Colab GPU)
├── Export to ONNX format
├── Test inference speed on EC2 t2.small (CPU)
└── Document baseline accuracy

Day 3-4: OpenCV 5 Integration
├── Implement preprocess pipeline (resize, normalize, augment)
├── Load YOLO via cv2.dnn.readNetFromONNX()
├── Implement detection parser (bbox + class + confidence)
├── Test with Sidoarjo photos
└── Document latency (target: <5s per image on CPU)

Day 5: SFace Privacy Blur
├── Load SFace + YuNet face detector via OpenCV 5
├── Implement face detection + Gaussian blur
├── Test with photos containing people
└── Verify: faces blurred before publication

Day 6: IQE (Inspection Quality Engine)
├── Implement Detection Confidence (from YOLO output)
├── Implement Inspection Quality:
│   ├── Image blur score (Laplacian variance)
│   ├── Lighting condition (brightness/contrast analysis)
│   └── GPS accuracy (from device metadata)
├── Implement Trust Score (weighted combination of all three)
└── Accept/Reject logic: Trust < threshold → status = pending_verification

Day 7: Validation + Documentation
├── Run full CV pipeline on 10 Sidoarjo photos
├── Record: detection results, confidence, quality, trust score
├── Document failure cases (false positives, missed detections)
└── Snapshot: working CV module (matamu-cv/)
```

**Deliverable:** `matamu-cv/` module — OpenCV 5 + YOLO + SFace + IQE working end-to-end on EC2.

---

### SPRINT 2 — BACKEND + BEDROCK (Sep 30 - Oct 6, 7 days)

**Goal:** Django API receives capture → runs CV → Bedrock reasoning → stores record → serves map data. Django Admin ready as operator dashboard.

```
Day 1-2: API Core (Django + Django Ninja)
├── POST /api/v1/capture — receive photo + GPS + timestamp
├── Store original to S3
├── Trigger CV pipeline (async via Celery or background task)
├── Store blurred evidence to S3
├── Return observation record
├── Django Admin: register Observation model → moderation queue ready
└── Django Admin: customize list display (class, severity, status, trust_score)

Day 3-4: Bedrock Integration (via LiteLLM proxy)
├── Haiku 4.5: condition summary from detection results
├── Gemini 3.7 Flash: severity assessment (multimodal — send image)
├── Haiku 4.5: dedup hints (compare with nearby reports)
├── Implement prompt templates
└── Test: capture → CV → Bedrock → structured response

Day 5: Database Layer (Postgres + PostGIS via django-contrib-gis)
├── Django models:
│   ├── Observation (id, class, bbox, confidence, lat, lng, timestamp,
│   │   severity, status, trust_score, evidence_url, summary)
│   ├── FollowUp (observation_id, status, created_at)
│   └── Reporter (id, name, created_at) -- minimal
├── Geo queries: observations within radius (PostGIS ST_DWithin)
├── Recurring detection: 3+ reports within 50m / 7 days
├── API endpoints: GET /api/v1/observations, GET /api/v1/observations/nearby
└── Django Admin: add follow-up inline, IQE display, accept/reject actions

Day 6: Agentic Vision Loop
├── Perception: YOLO detection + confidence + IQE trust score
├── Decision: Gemini Flash evaluates → severity + action
├── Action: system changes status, creates follow-up, alerts
├── Implement trace logging (for Agentic track evidence)
└── Test: low-confidence detection → pending_verification flow

Day 7: Integration Test + Google Geocoding
├── Reverse geocode: lat/lng → "Jl. Lingkar Timur, Sidoarjo" (Google API)
├── Full flow: upload → CV → blur → Bedrock → geocode → DB → published
├── Test with 10 Sidoarjo photos
├── Measure end-to-end latency
└── Document API with Swagger (Django Ninja built-in)
```

**Deliverable:** `matamu-backend/` — working Django API on EC2, Bedrock integrated, Postgres+PostGIS, Django Admin as operator dashboard, end-to-end capture→publish flow.

---

### SPRINT 3 — PWA FRONTEND (Oct 7-13, 7 days)

**Goal:** Warga bisa capture foto jalan → lihat di peta. Operator bisa kelola via dashboard.

```
Day 1-2: Warga PWA — Capture + Log
├── /capture: camera via navigator.mediaDevices.getUserMedia()
├── Get GPS via navigator.geolocation.getCurrentPosition()
├── Review screen: see photo, confirm submission
├── Upload: POST to Django API, show progress
├── /my-reports: list my reports + status badges
├── PWA manifest + service worker (installable)
└── Tailwind styling — mobile-first, minimal UI

Day 3-4: Public Map + Awareness
├── / (home): MapLibre + OpenStreetMap base layer
├── Plot observations as pins (color by severity)
├── Click pin → popup: photo, class, summary, timestamp, status
├── Heatmap layer (toggle: pins / heatmap)
├── Filter: class, severity, status, date range
├── "Near me" button: pan to user's GPS location
├── Follow-up badge: "Recurring" / "Unresolved" / "Acknowledged"
└── Responsive: works on mobile browser + desktop

Day 5: Operator Dashboard (same PWA, /admin route)
├── /admin: login screen (Django auth)
├── Map widget: all observations (filterable, full view)
├── Analytics widget: charts (class distribution, trend, avg trust)
├── Alert widget: recurring + high severity queue
├── IQE widget: trust score monitor, accept/reject actions
├── Follow-up manager: acknowledge / resolve buttons
└── Detail modal: full observation (photo, AI result, IQE breakdown, Bedrock summary)

Day 6: Google Maps Integration
├── Reverse geocode display: "Jl. Lingkar Timur No. 12, Sidoarjo"
├── Satellite imagery toggle (admin only — Google static maps)
└── Search: type address → pan map

Day 7: Integration + Polish
├── Test PWA → Django API → CV → Bedrock → DB → map: full flow
├── Fix CORS (Django CORS headers), upload size, timeout
├── PWA install test: add to home screen on mobile
├── Responsive: mobile warga + desktop admin both work
└── Snapshot: working PWA (capture + map + admin)
```

**Deliverable:** `matamu-frontend/` — PWA with warga experience (capture + log + map) + operator dashboard (admin). One codebase.

---

### SPRINT 4 — AGENTIC + INTEGRATION (Oct 14-20, 7 days)

**Goal:** Agentic Vision track evidence + full system integration + failure case documentation.

```
Day 1-2: Agentic Vision Hardening
├── Perception → Decision → Action trace (documented)
├── Scenario A: high confidence + high trust → auto-publish + Haiku summary
├── Scenario B: low confidence → Gemini Flash second opinion → pending
├── Scenario C: 3+ reports same area → recurring flag + follow-up alert
├── Scenario D: SFace detects face → blur before publish
├── Record traces for each scenario (for Agentic track submission)
└── Agent workflow diagram (perception → decision → action)

Day 3-4: System Integration
├── End-to-end test: 10 Sidoarjo photos through full pipeline
├── Fix edge cases: dark photos, blurry photos, no GPS, duplicate uploads
├── Load test: 50 concurrent uploads (does t2.small survive?)
├── Add error handling + retry logic
├── Add basic rate limiting (prevent abuse)
└── Django Admin: final polish (list filters, search, bulk actions)

Day 5: Observability
├── CloudWatch: API latency, CV processing time, Bedrock latency
├── Health check endpoint: /health
├── Simple stats endpoint: requests/day, detections/day, avg trust score
├── Log: every capture → CV result → Bedrock result → publish status
└── Responsible AI: log all accept/reject decisions with reasons

Day 6: Failure Case Documentation
├── False positive: non-pothole detected as pothole
├── False negative: pothole missed by YOLO
├── Low-light failure: photo too dark for detection
├── GPS failure: inaccurate location
├── Bedrock/LiteLLM failure: API timeout, fallback behavior
├── SFace failure: false blur or missed face
├── Document each: input, expected, actual, root cause, mitigation
└── This is REQUIRED for submission (evaluation evidence + failure cases)

Day 7: Architecture Diagram + Technical Report Draft
├── Architecture diagram (OpenCV 5 + AWS + Agentic flow)
├── Technical report outline:
│   ├── Problem & Users
│   ├── Architecture (with diagram)
│   ├── OpenCV 5 Implementation (substantive usage — DNN, SFace, IQE)
│   ├── AWS Deployment (EC2 + Bedrock/LiteLLM + S3 + Postgres/PostGIS)
│   ├── Evaluation (benchmarks, latency, accuracy, trust score distribution)
│   ├── Limitations & Failure Cases
│   └── Responsible Use (IQE, SFace blur, human review, Django Admin moderation)
├── Pin all dependencies (requirements.txt, package.json, Dockerfile)
└── Write build/deploy/test instructions
```

**Deliverable:** Agentic traces, architecture diagram, tech report draft, pinned dependencies, build instructions.

---

### SPRINT 5 — DEMO + SUBMIT (Oct 21-26, 6 days)

**Goal:** Everything ready for judge. Submit before deadline.

```
Day 1-2: Demo Preparation
├── Prepare 5-10 Sidoarjo road photos for live demo
├── Test live demo flow: capture → analyze → map → follow
├── Prepare fallback: pre-recorded demo in case live fails
├── Test web endpoint accessibility (judge can access URL from outside)
├── Set up domain or use EC2 public IP + HTTPS
└── Prepare screen-share backup option

Day 3-4: Video (≤5 minutes)
├── Script: intro team → problem → architecture → demo → results
├── Record screen: PWA walkthrough (warga capture + map + admin dashboard)
├── Show architecture diagram in video
├── Voice-over: Gemini 3.1 Flash TTS (or manual narration)
├── Edit: keep under 5 minutes
├── Upload: YouTube unlisted or Vimeo
└── Test: link works, video plays, audio clear

Day 5: Technical Report Final
├── Complete all sections
├── Add: benchmarks table (latency, accuracy, trust score distribution)
├── Add: architecture diagram (final version)
├── Add: failure case table
├── Add: responsible AI section (IQE, SFace blur, human review)
├── Add: pinned dependencies list
└── Add: build/deploy/test instructions

Day 6: Final Submission (Oct 26)
├── Code repo: push to GitHub (or provide archive)
├── Working web endpoint: verify accessible from outside
├── Video link: verify accessible
├── Technical report: upload
├── Architecture diagram: upload
├── Evaluation evidence: upload
├── Pinned dependencies: verify
├── SUBMIT on Devpost
└── Celebrate
```

**Deliverable:** Complete submission on Devpost. All 7 required deliverables uploaded.

---

## Submission Deliverables Checklist

| # | Deliverable | Sprint | Status |
|---|-------------|--------|--------|
| 1 | Technical report | S5 Day 5 | ⬜ |
| 2 | Code repository (GitHub) | S4 Day 7 | ⬜ |
| 3 | Pinned dependencies + build/deploy/test instructions | S4 Day 7 | ⬜ |
| 4 | Architecture diagram (OpenCV 5 + AWS + Agentic) | S4 Day 7 | ⬜ |
| 5 | Working web endpoint OR live screen-share | S5 Day 1 | ⬜ |
| 6 | Public/unlisted video ≤5 minutes | S5 Day 4 | ⬜ |
| 7 | Evaluation evidence (incl. failure cases) | S4 Day 6 | ⬜ |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| EC2 t2.small too slow for YOLO | Demo lag, judge sees slow system | Use YOLOv11n (smallest), pre-process demo images, rent GPU on-demand for final days |
| Bedrock/LiteLLM API latency/timeout | Capture flow hangs | 10s timeout + fallback: publish with YOLO-only + "pending review" |
| YOLO accuracy low on Sidoarjo roads | False positives/negatives | Fine-tune with 10 labeled local photos, document as "known limitation" |
| SFace false blur (blurs non-faces) | Evidence image degraded | Conservative threshold, document as tradeoff for privacy |
| PWA camera not supported on older browsers | Some users can't capture | Require Chrome/Safari 90+, show fallback message + manual upload |
| No GPU for YOLO training | Fine-tuning slow on CPU | Use Google Colab (free GPU) for training, export ONNX, deploy to EC2 |
| Django Admin too limited for operator dashboard | Operator UX suboptimal | Build custom /admin route in PWA, use Django Admin as backup only |

---

## What You Need to Prepare Right Now (Sep 21-22)

### Immediate Actions (this weekend):

1. **SSH into EC2 (krusetre)** → install Python venv, OpenCV 5, Ultralytics, Django 5
2. **Verify Bedrock + LiteLLM** → test Haiku 4.5 and Gemini 3.7 Flash from EC2
3. **Download RDD dataset** → GitHub/Roboflow (road damage detection)
4. **Take 5-10 photos** → Jalan Lingkar Timur or any Sidoarjo road with visible damage
5. **Create S3 bucket** → matamu-evidence
6. **Install Postgres + PostGIS** → on EC2 or use RDS
7. **Install Node.js 22** → on your laptop for PWA frontend
8. **Create Roboflow account** → for dataset management + labeling

### Estimated Effort:

| Sprint | Days | Your Time | My Time (code/config) |
|--------|------|-----------|----------------------|
| S0 Setup | 2 | 4-6h (infra + photos) | 2-3h (scripts + config) |
| S1 CV Pipeline | 7 | 3-4h (photos + labeling) | 6-8h (code) |
| S2 Backend + Bedrock | 7 | 2-3h (test scenarios) | 6-8h (code) |
| S3 PWA Frontend | 7 | 2-3h (UI feedback) | 6-8h (code) |
| S4 Agentic + Integration | 7 | 2-3h (demo review) | 6-8h (code + docs) |
| S5 Demo + Submit | 6 | 3-4h (video + submit) | 4-6h (report + diagram) |
| **Total** | **36** | **~20h your time** | **~30-40h my time** |

---

## Competition Scoring Alignment Per Sprint

| Sprint | Primary Scoring Contribution |
|--------|------------------------------|
| S1 | Technical Execution (30%) — OpenCV 5 DNN + YOLO + SFace + IQE |
| S2 | Innovation (20%) — Bedrock reasoning + Agentic loop; Cloud Delivery (10%) — Django + Postgres/PostGIS on EC2 |
| S3 | User Experience (10%) — PWA: warga capture + public map + admin dashboard |
| S4 | Real-world Impact (20%) — Integration + failure cases + observability |
| S5 | Documentation (10%) — Tech report + video ≤5min + architecture diagram |
