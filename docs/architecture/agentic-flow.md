# Mat(a)Mu — Agentic Vision Flow

## Perception → Decision → Action Loop

```
CAPTURE
  │  photo (JPEG) + GPS (lat, lng) + timestamp
  ▼
┌─────────────────────────────────────────┐
│            PERCEPTION                   │
│                                         │
│  OpenCV 5 DNN / YOLOv11n               │
│  ├── detected_class                     │
│  ├── confidence                         │
│  └── bbox                               │
│                                         │
│  IQE (Inspection Quality Engine)       │
│  ├── blur_score  (Laplacian variance)  │
│  ├── brightness  (mean pixel)          │
│  └── trust_score (weighted composite)  │
│                                         │
│  SFace + YuNet                         │
│  └── faces_blurred (count)             │
│                                         │
│  TypeSafe AI (5 parallel questions)    │
│  ├── severity   Score + confidence     │
│  ├── damage_class Choice + confidence  │
│  ├── urgency    Score + confidence     │
│  ├── photo_quality_ok  Noul            │
│  └── is_recurring      Noul            │
│                                         │
│  PostGIS ST_DWithin                    │
│  └── nearby_count (50m radius)         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│              DECISION                   │
│         (confidence-gated routing)      │
│                                         │
│  Gate E: photo_quality_ok < 0.5?       │
│  ├── YES → pending_verification         │
│  └── NO  ↓                             │
│                                         │
│  Gate B: YOLO confidence < 0.50?       │
│  ├── YES → pending_verification         │
│  └── NO  ↓                             │
│                                         │
│  Gate T: trust_score < 0.65?           │
│  ├── YES → pending_verification         │
│  └── NO  ↓                             │
│                                         │
│  TypeSafe severity confidence?          │
│  ├── >= 0.70 → auto-publish            │
│  ├── >= 0.40 → publish (monitor)       │
│  └──  < 0.40 → pending_verification    │
└─────────────────┬───────────────────────┘
                  │
          ┌───────┴───────┐
          │               │
          ▼               ▼
   "published"   "pending_verification"
          │               │
          ▼               ▼
┌─────────────────────────────────────────┐
│               ACTION                    │
│                                         │
│  PUBLISHED:                             │
│  ├── status = published                 │
│  ├── Haiku 4.5: summary (1 sentence)   │
│  ├── IF severity high/critical:         │
│  │   └── high_severity_alert_queued     │
│  └── IF nearby_count >= 3 OR            │
│       TypeSafe is_recurring > 0.7:      │
│       └── recurring_followup_created    │
│                                         │
│  PENDING VERIFICATION:                  │
│  ├── status = pending_verification      │
│  └── iQE_review_queued (IQE dashboard) │
└─────────────────┬───────────────────────┘
                  │
                  ▼
        TRACE LOG (JSON)
        ├── logger (structured)
        └── docs/agentic-traces/*.json
            (submission evidence)
```

## Scenario Matrix

| Scenario | Condition | Decision | Action |
|----------|-----------|----------|--------|
| **A** | confidence ≥ 0.50, trust ≥ 0.65, TypeSafe conf ≥ 0.70 | published | auto-publish + Haiku summary |
| **B** | confidence < 0.50 (low YOLO) | pending_verification | IQE review queue |
| **C** | nearby_count ≥ 3 (same area) | published | published + recurring_followup_created |
| **D** | faces_blurred > 0 (SFace) | published | blur applied before publish, privacy preserved |
| **E** | TypeSafe photo_quality_ok < 0.5 | pending_verification | IQE review queue |

## TypeSafe Confidence Gates

```
ts_severity_confidence:
  >= 0.70  →  auto-publish              (high confidence, decisive)
  >= 0.40  →  publish with monitoring   (medium confidence, acceptable)
   < 0.40  →  pending_verification      (low confidence, human review)
```

## Responsible AI Properties

- **Privacy**: SFace (YuNet face detector) blurs all detected faces **before** S3 upload
  - Evidence URL points to blurred version only
  - Original photo deleted from temp immediately
- **Human oversight**: IQE queue in operator dashboard for all pending cases
- **Explainability**: every decision logged with reason + confidence values
- **Auditability**: full trace JSON per observation (agentic track evidence)
