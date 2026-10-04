# Mat(a)Mu — Devpost Submission Draft

> OpenCV AI Competition 2026, powered by AWS
> Team: Blaz Labs
> Repository: https://github.com/oghlam/matamu

## Title

Mat(a)Mu — Agentic Public Watch for Safer Roads

## One-line Summary

An OpenCV 5 and AWS-powered civic vision platform that turns road photos into privacy-safe, confidence-gated, map-based reports and follow-up actions.

## Problem

Road damage is often noticed by citizens before it enters an official inspection workflow. Reports are fragmented, photos lack consistent context, and operators receive more observations than they can review manually. This delays prioritization of potholes, cracks, flooding, and surface degradation.

## Solution

Mat(a)Mu turns a phone into a public road-observation sensor. A citizen captures a photo and location in the PWA. The system processes the evidence through OpenCV 5, assigns a trust score, applies privacy blur, enriches the observation with AI-assisted interpretation and spatial context, and routes it to one of two outcomes:

- high-confidence observations are published automatically;
- ambiguous or low-quality observations are sent to an operator IQE review queue.

Published observations appear on a public map with severity, evidence, status, recurrence, and follow-up context. Operators use the dashboard to review, acknowledge, and resolve observations.

## Why This Matters

Mat(a)Mu creates an evidence layer between lived experience and institutional response. It does not replace engineering inspection or government maintenance systems; it makes recurring and unresolved road conditions easier to see, verify, prioritize, and discuss.

The pilot context is Jalan Lingkar Timur, Sidoarjo, East Java, Indonesia. The design is intended to generalize to other road corridors and public infrastructure monitoring use cases.

## How We Used AI

### Computer vision

- OpenCV 5 DNN loads the YOLOv11n ONNX model and performs preprocessing and inference.
- YOLO detects representative road-condition classes: pothole, longitudinal crack, alligator crack, rutting, flooding, and surface degradation.
- IQE combines detection confidence, image sharpness, and brightness into a trust score.
- YuNet/SFace detects faces and applies Gaussian blur before evidence is published.
- PostGIS spatial queries identify nearby observations and recurring issues.

### Language and multimodal reasoning

- Haiku generates a concise condition summary.
- Bedrock Sonnet is used for severity reasoning when configured.
- TypeSafe AI evaluates structured questions about severity, urgency, photo quality, and recurrence.
- The system supports a local/mock fallback so the core workflow remains testable without a live model proxy.

### Agentic behavior

The visual result changes what the system does next. Confidence and quality gates route each observation to automatic publication, monitoring, or human review. High-severity and recurring observations can create alerts and follow-up actions. Every decision is recorded as a structured trace.

## How We Used Codex

Codex was used as an engineering copilot across implementation and delivery: inspecting the repository, refining the OpenCV 5/CV pipeline, reviewing the agentic decision flow, validating test and failure-case evidence, and standardizing the technical report, demo script, and Devpost submission materials.

Codex was not itself the submitted agentic vision system. The submitted agentic behavior is the Mat(a)Mu runtime loop in which OpenCV 5 outputs influence routing and subsequent actions.

## Key Features

- Citizen-facing React PWA for photo capture, GPS capture, report history, and public map browsing.
- GPS watermarking to preserve visible location evidence when mobile operating systems strip EXIF metadata.
- OpenCV 5 + YOLOv11n road-condition detection.
- SFace/YuNet face privacy blur before publication.
- Inspection Quality Engine with confidence-gated routing.
- TypeSafe structured evaluation and AI-generated summaries.
- Agentic trace viewer for perception → decision → action evidence.
- Django operator dashboard with map, reports, IQE queue, alerts, and follow-up actions.
- PostGIS nearby/recurrence queries.
- AWS deployment path using EC2, S3, Bedrock, and IAM.
- Rate limiting, role-based operator access, audit traces, and human review for edge cases.

## Architecture

```text
Citizen PWA
  capture photo + live GPS + timestamp
        |
        v
Django / Django Ninja API
        |
        +--> OpenCV 5 DNN + YOLOv11n --> detections
        +--> IQE -----------------------> trust score
        +--> YuNet/SFace ----------------> privacy-blurred evidence
        +--> PostGIS --------------------> nearby/recurring context
        +--> TypeSafe / Bedrock ----------> structured reasoning
        |
        v
Agentic confidence gates
        |
        +--> published + summary + alert/follow-up
        +--> pending_verification + IQE human review
        |
        v
Public Map + Operator Dashboard + JSON Trace

AWS: EC2 application/CV runtime, S3 blurred evidence, Bedrock reasoning, IAM controls.
```

Detailed diagrams:

- [System architecture](docs/architecture/system-architecture.md)
- [Agentic vision flow](docs/architecture/agentic-flow.md)
- [Agentic trace evidence](docs/agentic-traces/)

## Testing Instructions

### Local setup

1. Copy `.env.example` to `.env` and provide local values.
2. Install backend dependencies from `matamu-backend/requirements.txt`.
3. Install frontend dependencies with `npm install` inside `matamu-frontend`.
4. Run `start-dev.bat`.

The local services are:

- Citizen PWA: `http://localhost:5173`
- Operator dashboard: `http://127.0.0.1:8080/dashboard/`
- API documentation: `http://127.0.0.1:8080/api/docs`

### Automated checks

```text
cd matamu-backend
venv\Scripts\python.exe docs\integration_test.py
venv\Scripts\python.exe docs\agentic_scenario_runner.py
```

The current local baseline is 46/46 integration checks and 4/4 agentic scenarios. The test suite covers capture, validation, GPS edge cases, duplicate/nearby logic, privacy processing, confidence gates, and fallback behavior.

### Judge demo flow

1. Open the PWA and capture or upload a road image.
2. Allow location access and confirm the GPS watermark on the evidence image.
3. Submit the report.
4. Show the returned damage class, confidence, trust score, status, and summary.
5. Open the public map and select the report.
6. Open the operator dashboard and show the observation, IQE queue, or follow-up state.
7. Open `/dashboard/agentic/` and show the trace explaining the routing decision.

## Public Demo Link

- Citizen PWA: https://matamu.32-193-23-154.nip.io
- Operator dashboard: https://matamu-dash.32-193-23-154.nip.io/dashboard

The PWA is the primary public entry point. The dashboard is the operator/judge view.

## Public Repository Link

https://github.com/oghlam/matamu

## Demo Video

`[TODO: insert public or unlisted YouTube/Vimeo URL; maximum 5 minutes]`

The video should show the team, the working application, OpenCV 5/AWS architecture, the capture-to-map flow, the agentic decision trace, and the evaluation result.

## Screenshot Shot List

Use 3–5 screenshots, each with a short caption:

1. Citizen PWA capture screen showing road evidence, GPS watermark, and submit action.
2. Public map showing severity-coded observations and a selected evidence card.
3. Operator dashboard showing map, KPIs, severity distribution, and live alerts.
4. IQE queue showing a low-confidence observation routed to human review.
5. Agentic trace viewer showing perception signals, decision reason, and action.

Candidate assets already in the repository include `docs/dash-ui.webp`, `docs/matamu-agentic-diagram.png`, and the dashboard/PWA assets under `docs/` and `matamu-frontend/public/`.

## Evaluation Evidence

The current evidence package reports:

| Evidence | Result |
|---|---:|
| Integration checks | 46/46 pass |
| Agentic scenarios | 4/4 pass |
| Sidoarjo evaluation photos | 6 |
| Average trust score | 0.805 |
| Correctly blurred detected faces | 2/2 |
| False blurs in evaluation set | 0 |
| Mock-mode capture latency | approximately 2 seconds |

See [failure cases and evaluation evidence](docs/evaluation/failure-cases.md) and the trace files in [docs/agentic-traces](docs/agentic-traces/).

## Known Limitations

- The current evaluation set is small and geographically focused on Sidoarjo.
- YOLOv11n can miss small, occluded, or edge-of-frame defects.
- Shadows and paint markings can produce false-positive pothole detections.
- Low-light images are intentionally routed to review instead of being auto-published.
- Local testing uses mock model fallbacks when LiteLLM/Bedrock is unavailable; production claims must be demonstrated on the public deployment.
- Demo coordinates are controlled pilot data and should not be presented as a statistically representative city-wide survey.
- The public endpoint, final production benchmark, and video URL still need to be filled into this document.

## Official Devpost Form Fields

| Devpost field | Prepared value |
|---|---|
| Special Award Consideration | `Agentic Vision Award` — select only if the trace and runtime demo are included. Do not select COOL unless COOL runs the core workload on AWS Graviton/Arm with comparative evidence. |
| Repository URL | `https://github.com/oghlam/matamu` |
| Testing instructions | Use the instructions in this document and `docs/devpost/TESTING.md`. |
| Working web endpoint | `https://matamu.32-193-23-154.nip.io` and `https://matamu-dash.32-193-23-154.nip.io/dashboard` |
| Required video | `[TODO: public/unlisted video URL, <= 5 minutes]` |
| Required archive/zip | `[TODO: create judge-accessible archive if Devpost asks for upload]` |

## Submission Readiness

- [x] Project title and positioning drafted.
- [x] Problem, users, solution, architecture, and responsible-use story drafted.
- [x] OpenCV 5 and AWS implementation described.
- [x] Agentic Vision evidence mapped to runtime traces and scenarios.
- [x] Testing and failure-case documentation linked.
- [x] Repository URL confirmed from Git remote.
- [ ] Capture 3–5 final screenshots with captions.
- [ ] Record and publish the <=5-minute demo video.

> Project documentation, local validation, and live demo URLs are ready. Before submitting, add the video URL and attach the selected screenshots/assets.

## Supporting Documents

- [Devpost documentation index](docs/devpost/README.md)
- [Testing and reproducibility guide](docs/devpost/TESTING.md)
- [Demo video script](docs/devpost/DEMO-SCRIPT.md)
- [Evidence matrix](docs/devpost/EVIDENCE-MATRIX.md)
