# Mat(a)Mu - Mata Jalan Masyarakat

> Agentic Computer Vision untuk monitoring kondisi jalan berbasis laporan warga  
> OpenCV AI Competition 2026 · Blaz Labs

![Mat(a)Mu Logo](docs/logo.png)

## Apa Itu Mat(a)Mu?

Mat(a)Mu ("Mata Jalan Mu") adalah aplikasi PWA yang mengubah warga menjadi sensor hidup untuk monitoring kondisi jalan. Cukup foto → submit → AI agent (Bedrock Haiku) memproses, mendeteksi kerusakan (YOLO), blur wajah (SFace), nilai kepercayaan (IQE), dan buat summary + severity.

**Operator** dapat prioritas perbaikan berdasar severity + evidence + geo-proximity.

## Stack

- **CV**: OpenCV 5.0.0.93, YOLOv11n (Ultralytics 8.4.159), SFace/YuNet
- **Backend**: Django 5.1, Django Ninja 1.3.0, google-auth 2.58.0 (SQLite lokal; PostGIS di EC2) + Overpass proxy (`/api/overpass`)
- **Frontend**: React 19, Vite 8.3.0, Tailwind 3.4.19, MapLibre GL 4.7.1, exifr, JetBrains Mono
- **Map**: CARTO Positron + Esri World Imagery (keyless) + MapLibre 3D terrain (demotiles) + OpenFreeMap 3D buildings + Overpass roads + TomTom live traffic (via PowerUp) + Cesium Ion Bing (via PowerUp)
- **LLM**: Haiku 4.5 (summary) + Bedrock Sonnet 4.5 (severity) via LiteLLM — mock lokal bila proxy kosong
- **Agentic**: Perception → Decision → Action + TypeSafe confidence gating, trace JSON
- **Storage**: S3 `matamu-evidence` (prod); `/media/` lokal (dev)

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

### Warga (React PWA — `http://localhost:5173`)
- **Capture**: Live camera (viewfinder + scanline) atau upload galeri → GPS live wajib aktif → submit
- **Auth**: Login Google OAuth (mode dev: bypass) — tanpa login hanya bisa melihat
- **Verified / Pending**: Hasil submit tampil langsung + alasan + trust score
- **My Reports**: Hanya laporan sendiri + alasan pending + tombol share
- **Public Map**: Pin warna severity, foto di popup, heatmap, KPI radius 2 km, recurring count, direction OSRM, share per laporan (`/r/:id`) + **3D terrain & buildings** (free DEM + OpenFreeMap, toggle Box/Mountain, pinch to tilt, auto-tilt on pin tap) + **Traffic** (free sim green boxes 6×4 via Overpass, live TomTom green/orange/red via PowerUp, status chip Fetching→Completed) + **Base map** (Light/Satellite/Bing via Ion, PowerUp) + **PowerUp** (ROUND STATION modal for TomTom & Cesium Ion keys)
- **Anti-spoof**: EXIF galeri disilang GPS (>500m ditolak); backend paksa pending

### Operator (Django Dashboard — `/dashboard/`)
- **Overview**: MapLibre canvas-first (CARTO + satelit Esri hybrid + **Bing via Ion**), KPI pills, kartu Location + foto bukti + arc severity (compact 72px, h-168), **header collapse ^/v**, 3D terrain & buildings, Traffic (same green boxes, live via PowerUp), base map Light/Sat/Ion cycle, **PowerUp** (above Logout) for TomTom & Ion keys
- **Reports**: Tabel + filter + kolom Reporter (email OAuth)
- **IQE Queue**: Antrian trust rendah + thumbnail + modal inspeksi + Accept/Reject (Supervisor only)
- **Follow-up**: Acknowledge / resolve + RBAC
- **RBAC**: Grup Operator vs Supervisor (`can_moderate_iqe`); akun via `/admin/` (tidak didemokan ke juri)

### Agentic Loop
1. **Perception**: YOLO detect → IQE trust → SFace blur → TypeSafe 5 pertanyaan → nearby count
2. **Decision**: Confidence-gated routing (auto-publish vs pending + alasan)
3. **Action**: Publish/pending, S3 (atau `/media/` lokal), trace JSON
4. **Dijaga 2x**: AI gate-1, operator gate-2 (modal foto IQE)

## Dataset

- **RDD**: Road Damage Detection (Facebook Research)
- **Roboflow**: Pothole dataset (YOLO format)
- **Sidoarjo**: Foto lokal untuk demo + fine-tuning

## Menjalankan Lokal

```cmd
start-dev.bat
```

Membuka 2 terminal (Django `:8080` + Vite `:5173`) lalu browser ke dashboard.

| URL | Isi |
|---|---|
| `http://localhost:5173` | PWA Warga (mode dev: tombol "Masuk (Mode Dev)") |
| `http://127.0.0.1:8080/dashboard/` | Operator Dashboard (`admin` / `<redacted-password>`) |
| `http://127.0.0.1:8080/api/docs` | API docs (Ninja) |

> Port 8080 (bukan 8000 — diklaim Windows service). Login Google asli butuh `GOOGLE_CLIENT_ID` (lihat `.env.example`).

**Verifikasi:**
```cmd
cd matamu-backend
venv\Scripts\python.exe docs\agentic_scenario_runner.py   # harap 4/4 PASS
venv\Scripts\python.exe docs\integration_test.py          # harap 42/42 PASS
```

## License

MIT © 2026 Mat(a)Mu Team

## Competition

**OpenCV AI Competition 2026**  
Blaz Labs Track  
Deadline: 26 Oktober 2026, 23:59 PT

---

**Status**: Sprint 0–4 selesai lokal. **24 Sep 2026 — Map 3D + Traffic + PowerUp + Base map Ion + Overpass proxy** done (PWA & dashboard). Sprint 5 (video + submit) remaining.
