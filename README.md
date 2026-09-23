# Mat(a)Mu - Mata Jalan Masyarakat

> Agentic Computer Vision untuk monitoring kondisi jalan berbasis laporan warga  
> OpenCV AI Competition 2026 · Blaz Labs

![Mat(a)Mu Logo](docs/logo.png)

## Apa Itu Mat(a)Mu?

Mat(a)Mu ("Mata Jalan Mu") adalah aplikasi PWA yang mengubah warga menjadi sensor hidup untuk monitoring kondisi jalan. Cukup foto → submit → AI agent (Bedrock Haiku) memproses, mendeteksi kerusakan (YOLO), blur wajah (SFace), nilai kepercayaan (IQE), dan buat summary + severity.

**Operator** dapat prioritas perbaikan berdasar severity + evidence + geo-proximity.

## Stack

- **CV**: OpenCV 5, YOLOv11n, SFace
- **Backend**: Django 5, PostGIS, Django Ninja API
- **Frontend**: React, Vite, Tailwind, MapLibre GL
- **LLM**: AWS Bedrock (Claude Haiku 4.5) + Google Gemini 3.7 Flash
- **Agentic**: Loop 5 iterasi (perception → decision → action)
- **Storage**: PostgreSQL + PostGIS, AWS S3 (evidence)

## Struktur Repo

```
matamu/
├── matamu-backend/         # Django + PostGIS + agentic loop
│   ├── api/                # Django Ninja endpoints
│   ├── observations/       # Model utama
│   ├── dashboard/          # Operator panel
│   └── requirements.txt
├── matamu-frontend/        # React PWA
│   ├── src/pages/warga/    # Warga: Capture, MyReports, PublicMap
│   └── src/components/
├── matamu-cv/              # CV pipeline (YOLO, SFace, IQE)
└── docs/
    ├── architecture/       # System & agentic flow
    ├── agentic-traces/     # Execution logs
    ├── evaluation/         # Failure cases
    └── sprints/            # Sprint plan & progress
```

## Fitur Utama

### Warga
- **Capture**: Foto → GPS auto → submit
- **My Reports**: List laporan pribadi
- **Public Map**: Lihat kondisi jalan sekitar (heatmap)

### Operator (Django Admin + Dashboard)
- **Observations**: List semua laporan + filter
- **IQE**: Trust score per foto (blur, noise, lighting)
- **Follow-up**: Timeline tindakan (surveyed, repaired, completed)
- **Map Analytics**: Geo query (radius, severity cluster)

### Agentic Loop
1. **Perception**: YOLO detect → blur faces → IQE score
2. **Decision**: Bedrock summary + severity (Gemini validation)
3. **Action**: Publish/reject, store S3, notify operator
4. **Reflect**: Log trace, update model jika perlu
5. **Repeat**: Max 5 iterasi, fallback jika timeout

## Dataset

- **RDD**: Road Damage Detection (Facebook Research)
- **Roboflow**: Pothole dataset (YOLO format)
- **Sidoarjo**: Foto lokal untuk demo + fine-tuning

## Deployment

**Sementara: Development Mode**

```bash
# Backend (EC2/local)
cd matamu-backend
python manage.py runserver

# Frontend (local)
cd matamu-frontend
npm run dev
```

**⚠️ Catatan**: Auto-deploy CI/CD ke EC2 AWS belum diaktifkan (server EC2 belum siap).

## License

MIT © 2026 Mat(a)Mu Team

## Competition

**OpenCV AI Competition 2026**  
Blaz Labs Track  
Deadline: 26 Oktober 2026, 23:59 PT

---

**Status**: Sprint 3 (PWA) selesai. Sprint 4 (hardening) ongoing.
