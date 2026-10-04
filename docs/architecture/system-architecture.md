# Mat(a)Mu — System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USERS                                      │
│                                                                     │
│   Warga (Citizen)              Operator (Road Authority)            │
│   Mobile PWA (React)           Dashboard (Django Template)          │
│   /capture  /my-reports  /     /dashboard/  /dashboard/iqe  etc.   │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │ HTTPS                        │ HTTPS
               ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EC2 (krusetre, t2.small)                         │
│                    AWS ap-southeast-1                               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Django 5 + Django Ninja (API)                  │   │
│  │                                                             │   │
│  │  POST /api/v1/capture                                       │   │
│  │   │                                                         │   │
│  │   ├── 1. OpenCV 5 DNN (YOLOv11n ONNX)                      │   │
│  │   │      ├── Object detection (pothole, crack, etc.)        │   │
│  │   │      └── bbox + confidence                              │   │
│  │   │                                                         │   │
│  │   ├── 2. IQE (Inspection Quality Engine)                   │   │
│  │   │      ├── Blur score (Laplacian variance)               │   │
│  │   │      ├── Brightness (mean pixel analysis)              │   │
│  │   │      └── Trust Score (weighted composite)              │   │
│  │   │                                                         │   │
│  │   ├── 3. SFace Privacy Blur                                 │   │
│  │   │      ├── YuNet face detection                          │   │
│  │   │      └── Gaussian blur (faces only)                    │   │
│  │   │                                                         │   │
│  │   ├── 4. S3 Upload (blurred evidence only)                 │   │
│  │   │                                                         │   │
│  │   ├── 5. Google Maps Geocoding (reverse geocode)           │   │
│  │   │                                                         │   │
│  │   ├── 6. LiteLLM Proxy                                     │   │
│  │   │      ├── Haiku 4.5 → condition summary (English)       │   │
│  │   │      ├── Sonnet 4.5 → severity assessment (vision)    │   │
│  │   │      └── Haiku 4.5 → dedup hint (recurring)           │   │
│  │   │                                                         │   │
│  │   ├── 7. TypeSafe AI (5 parallel structured questions)     │   │
│  │   │      ├── severity  (Score, calibrated confidence)      │   │
│  │   │      ├── damage_class (Choice, confidence)             │   │
│  │   │      ├── urgency   (Score)                             │   │
│  │   │      ├── photo_quality_ok (Noul)                       │   │
│  │   │      └── is_recurring (Noul)                           │   │
│  │   │                                                         │   │
│  │   └── 8. Agentic Loop (Perception → Decision → Action)    │   │
│  │          ├── PERCEPTION: signals from steps 1-7            │   │
│  │          ├── DECISION:  confidence-gated routing           │   │
│  │          │    ├── published (high conf + trust)            │   │
│  │          │    └── pending_verification (human review)      │   │
│  │          └── ACTION: status + followup + trace JSON        │   │
│  │                                                             │   │
│  │  GET  /api/v1/observations   (public map data)             │   │
│  │  GET  /api/v1/stats          (dashboard stats)             │   │
│  │  GET  /api/v1/observations/nearby  (geo query)             │   │
│  │  POST /api/v1/observations/{id}/followup                   │   │
│  │  GET  /health                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────┐  ┌────────────────────────────────────────┐  │
│  │  PostgreSQL 16   │  │  Django Admin + Custom Dashboard       │  │
│  │  + PostGIS 3     │  │  /admin/  → Django Admin               │  │
│  │                  │  │  /dashboard/ → Operator Dashboard      │  │
│  │  Observation     │  │   ├── Overview (MapLibre + Esri sat + Bing via Ion + 3D terrain/buildings + Traffic live/sim)   │  │
│  │  FollowUp        │  │   ├── Reports (filter/search)          │  │
│  │                  │  │   ├── IQE Queue (accept/reject)        │  │
│  └──────────────────┘  │   └── Follow-up manager               │  │
│                         └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────┐     ┌──────────────────────────────────────┐
│  AWS S3              │     │  External Services (server-side only) │
│  matamu-evidence     │     │  ├── AWS Bedrock Haiku 4.5 + Sonnet 4.5│
│  ├── /evidence/*.jpg │     │  ├── TypeSafe AI (jev-latest)         │
│  │   (blurred only)  │     │  └── via LiteLLM proxy                │
│  └── lifecycle: 30d  │     └──────────────────────────────────────┘
                              └──────────────────────────────────────┘
```

## OpenCV 5 Usage (Substantive)

```
cv2.dnn.readNetFromONNX()    → load YOLOv11n ONNX model
cv2.dnn.blobFromImage()      → preprocess (resize, normalize)
cv2.FaceDetectorYN.create()  → YuNet face detector (SFace)
cv2.GaussianBlur()           → privacy blur on detected faces
Laplacian variance           → image blur quality score (IQE)
```

## Data Flow (Capture → Publish)

```
[Photo + GPS] → OpenCV DNN → IQE → SFace → S3 → Geocode →
LiteLLM (Haiku+Sonnet) → TypeSafe → Agentic Loop →
DB (Observation) → [published | pending_verification]
```

## Deployment

| Component | Service | Region |
|-----------|---------|--------|
| Backend API | EC2 t2.small | ap-southeast-1 |
| Database | PostgreSQL 16 + PostGIS | EC2 local |
| Evidence storage | S3 (matamu-evidence) | ap-southeast-1 |
| LLM proxy | LiteLLM on EC2 | EC2 local |
| Frontend (warga PWA) | Static / EC2 | ap-southeast-1 |
| Basemap tiles | OpenFreeMap Bright, OSM data (free, keyless) | CDN |
| Satellite tiles | Esri ArcGIS (free) | CDN |
| Bing tiles (via Ion) | Cesium Ion (Bing) | via PowerUp |
| Geocoding | Google Maps API | server-side only |
| Traffic flow | TomTom (free tier, via PowerUp) / Overpass (OSM roads, via /api/overpass proxy) | server-side proxy + client sim |
| 3D terrain | MapLibre demotiles (free) + OpenFreeMap buildings | client |
