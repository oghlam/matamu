# Mat(a)Mu

> **Agentic Computer Vision** for road damage monitoring via citizen reports

![OpenCV](https://img.shields.io/badge/OpenCV-5-5C3EE8?logo=opencv&logoColor=white)
![YOLOv11](https://img.shields.io/badge/YOLOv11-Ultralytics-FF6B00)
![Django](https://img.shields.io/badge/Django-5-092E20?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-4-396CB2?logo=maplibre&logoColor=white)
![PostGIS](https://img.shields.io/badge/PostGIS-16-336791?logo=postgresql&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-enabled-4CAF50)
![TypeSafe AI](https://img.shields.io/badge/TypeSafe_AI-eval-6B7280)
![TomTom](https://img.shields.io/badge/TomTom-traffic-DF1B12?logo=tomtom&logoColor=white)
![Cesium Ion](https://img.shields.io/badge/Cesium_Ion-3D_tiles-2196F3?logo=cesium&logoColor=white)
![Amazon Nova](https://img.shields.io/badge/Amazon_Nova-Lite_Pro-FF9900?logo=amazon&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-EC2_S3-232F3E?logo=amazon&logoColor=white)

![Mat(a)Mu agentic pipeline diagram](docs/matamu-agentic-diagram.png)

---

## 🎯 What Makes Mat(a)Mu Different?

**Not just another pothole detector.**

Mat(a)Mu is an **agentic vision system** — AI that doesn't just detect damage, but **perceives → decides → acts autonomously**, with human oversight only for edge cases.

### Traditional CV Systems
```
Photo → Model Prediction → Human Reviews All → Human Decides → Human Acts
```
**Problem:** Doesn't scale. 1 operator = 10 reports/day max.

### Mat(a)Mu (Agentic)
```
Photo → Perception (YOLO+IQE+SFace+TypeSafe+PostGIS) 
      → Decision (confidence-gated routing)
      → Action (auto-publish + alert + trace)
```
**Result:** 1 operator = 1000+ reports/day. **100× scalability.**

📖 **[Read: Why Agentic Vision?](docs/WHY-AGENTIC.md)** — Full technical deep-dive on the perception-decision-action loop, business impact, and real-world relevance.

---

## What Is Mat(a)Mu?

Mat(a)Mu ("Mata Jalan Mu" — Your Road Eyes) is a PWA that turns citizens into living sensors for road condition monitoring. Just snap a photo → submit → the AI agent processes it: detects damage (YOLO), blurs faces (SFace), scores trust (IQE), and writes a summary + severity.

**Operators** get repair priorities based on severity + evidence + geo-proximity.

---

## Product Screenshots

The following screenshots show the citizen PWA, public map, evidence detail, operator dashboard, follow-up workflow, and Agentic Vision trace.

<table>
  <tr>
    <td><img src="docs/devpost/screenshots/01-pwa-public-map.png" alt="Mat(a)Mu public map" /></td>
    <td><img src="docs/devpost/screenshots/02-pwa-capture.png" alt="Mat(a)Mu capture flow" /></td>
    <td><img src="docs/devpost/screenshots/03-pwa-my-reports.png" alt="Mat(a)Mu reports" /></td>
  </tr>
  <tr>
    <td><img src="docs/devpost/screenshots/04-pwa-evidence-detail.png" alt="Mat(a)Mu evidence detail" /></td>
    <td><img src="docs/devpost/screenshots/06-dashboard-overview.png" alt="Mat(a)Mu dashboard overview" /></td>
    <td><img src="docs/devpost/screenshots/07-dashboard-agentic-trace.png" alt="Mat(a)Mu Agentic Vision trace" /></td>
  </tr>
  <tr>
    <td><img src="docs/devpost/screenshots/08-dashboard-followup.png" alt="Mat(a)Mu follow-up dashboard" /></td>
    <td><img src="docs/devpost/screenshots/09-pwa-map-mobile.png" alt="Mat(a)Mu mobile map" /></td>
    <td><img src="docs/devpost/screenshots/10-pwa-capture-mobile.png" alt="Mat(a)Mu mobile capture" /></td>
  </tr>
</table>

---

## 🚀 Key Features

### 1. **Agentic Decision Loop**
- **Perception**: 6 intelligence signals (YOLO + IQE + SFace + TypeSafe + Bedrock + PostGIS)
- **Decision**: Confidence-gated routing (5 gates: quality, YOLO conf, trust, EXIF, TypeSafe)
- **Action**: Auto-publish OR human review + alert + follow-up + trace JSON
- **Result**: 80% auto-processed, 20% routed to IQE queue with reasoning

### 2. **Multi-Model Orchestration**
- **YOLOv11n** (OpenCV 5 DNN): damage detection
- **IQE**: blur + brightness quality check
- **SFace + YuNet**: face detection + auto-blur (privacy-by-design)
- **TypeSafe AI**: structured 5-question eval (severity, urgency, recurrence)
- **Amazon Nova Pro**: multimodal severity reasoning (fallback)
- **PostGIS**: spatial clustering (recurring damage detection)

### 3. **Production-Ready Safeguards**
- ✅ **Privacy**: SFace auto-blur before S3 upload
- ✅ **Human-in-loop**: IQE queue for edge cases (trust <0.4, EXIF mismatch)
- ✅ **Explainability**: Trace JSON per observation (perception → decision → action)
- ✅ **Auditability**: Dashboard `/agentic/` shows all AI decisions + reasoning
- ✅ **24/7 Operation**: No human bottleneck (overnight reports auto-processed)

---

## Stack

- **CV**: OpenCV 5.0.0.93, YOLOv11n (Ultralytics 8.4.159), SFace/YuNet
- **Backend**: Django 5.1, Django Ninja 1.3.0, google-auth 2.58.0 (local SQLite; PostGIS on EC2) + Overpass proxy (`/api/overpass`)
- **Frontend**: React 19, Vite 8.3.0, Tailwind 3.4.19, MapLibre GL 4.7.1, exifr, JetBrains Mono
- **Map**: OpenFreeMap Bright (OSM data, keyless) + Esri World Imagery (keyless) + MapLibre 3D terrain (demotiles) + OpenFreeMap 3D buildings + Overpass roads + TomTom live traffic (via PowerUp) + Cesium Ion Bing (via PowerUp)
- **LLM**: Amazon Nova Lite (summary) + Amazon Nova Pro (severity) via LiteLLM/Bedrock — local heuristic fallback when unavailable
- **Agentic**: Perception → Decision → Action + TypeSafe confidence gating, trace JSON
- **Storage**: S3 `matamu-evidence` (prod); local `/media/` (dev)

---

## Repository Structure

```
matamu/
├── matamu-backend/         # Django + PostGIS + agentic loop
│   ├── api/                # Django Ninja endpoints
│   ├── observations/       # Main model
│   ├── dashboard/          # Operator panel
│   └── requirements.txt
├── matamu-frontend/        # React PWA
│   ├── src/pages/warga/    # Citizen pages: Capture, MyReports, PublicMap
│   └── src/components/
├── matamu-cv/              # CV pipeline (YOLO, SFace, IQE)
└── docs/
    ├── WHY-AGENTIC.md      # 🔥 Value proposition deep-dive
    ├── architecture/       # System & agentic flow
    ├── agentic-traces/     # Execution logs
    └── evaluation/         # Failure cases
```

---

## Features

### Citizen (React PWA — `http://localhost:5173`)
- **Capture**: Live camera (viewfinder + scanline) or gallery upload → location from photo EXIF (file later from a safe place) or live GPS fallback → submit
- **Auth**: Google sign-in — browse freely without an account, sign in to submit reports
- **Verified / Pending**: Submit result shown instantly + reason + trust score
- **My Reports**: Only your own reports + pending reasons + share buttons
- **Public Map**: Severity-colored pins, photos in popups, heatmap, 2 km radius KPI, recurring count, OSRM directions, per-report share (`/r/:id`) + **3D terrain & buildings** (free DEM + OpenFreeMap, Box/Mountain toggle, pinch to tilt, auto-tilt on pin tap) + **Traffic** (free green-box sim 6×4 via Overpass, live TomTom green/orange/red via PowerUp, Fetching→Completed status chip) + **Base map** (Light/Satellite/Bing via Ion, PowerUp) + **PowerUp** (ROUND STATION modal for TomTom & Cesium Ion keys)
- **Anti-spoof**: Gallery photos use embedded EXIF location; photos without EXIF fall back to live GPS

### Operator (Django Dashboard — `/dashboard/`)
- **Overview**: Canvas-first MapLibre map (OpenFreeMap Bright + Esri hybrid satellite + **Bing via Ion**), KPI pills, Location card + evidence photo + severity arc (compact 72px, h-168), **collapsible header ^/v**, 3D terrain & buildings, Traffic (same green boxes, live via PowerUp), Light/Sat/Ion base map cycle, **PowerUp** (above Logout) for TomTom & Ion keys
- **Reports**: Table + filters + Reporter column (OAuth email) + Supervisor-only maintenance delete
- **IQE Queue**: Low-trust queue + thumbnails + inspection modal + Accept/Reject (Supervisor only) + **review_reason** display (why pending)
- **Agentic**: `/dashboard/agentic/` — viewer for the 50 latest traces (timestamp, detection, conf, status, routing, decision reason, actions)
- **Follow-up**: Acknowledge / resolve + RBAC
- **RBAC**: Operator vs Supervisor groups (`can_moderate_iqe`); accounts via `/admin/`

### Agentic Loop
1. **Perception**: YOLO detect → IQE trust → SFace blur → TypeSafe 5 questions → nearby count
2. **Decision**: Confidence-gated routing (auto-publish vs pending + reason)
3. **Action**: Publish/pending, S3 (or local `/media/`), trace JSON
4. **Double-guarded**: AI gate-1, operator gate-2 (IQE photo modal)

**Example Use Case:** 500 reports overnight → 450 auto-published (high conf), 50 routed to IQE (low conf) → operator reviews 50 in 90 minutes (not 500 in 8 hours).

---

## Dataset

- **RDD**: Road Damage Detection (Facebook Research)
- **Roboflow**: Pothole dataset (YOLO format)
- **Sidoarjo**: Local photos for demo + fine-tuning

---

## Running Locally

```cmd
start-dev.bat
```

Opens 2 terminals (Django `:8080` + Vite `:5173`), then a browser on the dashboard.

| URL | Contents |
|---|---|
| `http://localhost:5173` | Citizen PWA |
| `http://127.0.0.1:8080/dashboard/` | Operator Dashboard |
| `http://127.0.0.1:8080/api/docs` | API docs (Ninja) |

> Backend serves on port 8080. Copy `.env.example` to `.env` and fill in the required keys.

---

## Why Agentic?

Traditional CV: Photo → Prediction → **Human bottleneck**  
Mat(a)Mu: Photo → Perception → Decision → **Automated action**

**Read the full story:** [docs/WHY-AGENTIC.md](docs/WHY-AGENTIC.md)

Key benefits:
- 🚀 **100× scalability** (1 operator = 1000 reports/day)
- 🛡️ **Safe automation** (human-in-loop for edge cases)
- 📊 **Full auditability** (trace JSON per observation)
- 🔒 **Privacy-by-design** (SFace auto-blur)
- ⚡ **24/7 operation** (no human bottleneck)

---

## License

MIT © 2026 Mat(a)Mu Team

## Submission Documentation

The Devpost-ready write-up and supporting evidence are maintained in [`DEVPOST-SUBMISSION.md`](DEVPOST-SUBMISSION.md) and [`docs/devpost/`](docs/devpost/).
