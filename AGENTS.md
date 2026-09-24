# AGENTS.md — Mat(a)Mu Build Guide

> Panduan untuk AI agent (CodeBuddy/WorkBuddy) dan developer saat mengerjakan project Mat(a)Mu.
> Workdir: `C:\laragon\www\matamu`
> Competition: OpenCV AI Competition 2026 · Blaz Labs
> Deadline: 26 Oktober 2026, 23:59 Pacific Time

---

## STATUS BERLAKU (24 Sep 2026) — BACA DULU

Sprint 0–4 selesai lokal + **24 Sep Map 3D + Traffic + PowerUp + Base map Ion** selesai (PWA & dashboard). Bagian "Sprint Pertama: SPRINT 0" di bawah adalah **arsip historis**, bukan tugas aktif.

| Layanan | URL lokal | Cara jalan |
|---|---|---|
| Django + Operator Dashboard | `http://127.0.0.1:8080/dashboard/` (login `admin` / `<redacted-password>`) | via `start-dev.bat` |
| API + docs | `http://127.0.0.1:8080/api/docs` | sama |
| PWA Warga | `http://localhost:5173` | sama |
| Overpass proxy | `http://127.0.0.1:8080/api/overpass` | Django multi-mirror (reliable) |

**Kenapa port 8080, bukan 8000:** port 8000 diklaim Windows service (`svchost`) — Django tidak punya izin. Jangan pindah kembali.

**Akun/pembeda penting:**
- gcloud aktif: `oghlam@gmail.com`, project `<redacted-gcp-project>` (Maps Geocoding aktif di sini)
- OAuth Client ID Google **belum dibuat** (butuh 1 langkah browser) → backend `BYPASS_AUTH=1`, PWA mode dev
- DB lokal: `matamu-backend/db.sqlite3` — 6 foto demo Lingkar Timur (id 3–8), koordinat manual (foto tanpa EXIF GPS)

**Perintah kunci:**
```cmd
start-dev.bat                                   # jalankan backend + PWA sekaligus
cd matamu-backend && venv\Scripts\python.exe manage.py seed_roles   # (sekali saja) grup Operator/Supervisor
venv\Scripts\python.exe docs/agentic_scenario_runner.py             # harap 4/4 PASS
venv\Scripts\python.exe docs/integration_test.py                    # harap 42/42 PASS
```
> Catatan Windows: output Python non-ASCII butuh `$env:PYTHONIOENCODING="utf-8"`. Jangan print panah `→`/emoji ke console (cp1252 crash).

---

## Aturan Main

1. **Baca konteks dulu** sebelum mulai coding — cek `docs/sprints/SPRINT_PLAN.md` dan `docs/sprints/PROGRESS-2026-09-23.md`
2. **Jangan publish bahan mentah** ke GitHub — `.gitignore` sudah set (proposal, blueprint, cover, credentials)
3. **Satu PR per fitur** — jangan campur scope antar sprint
4. **Test sebelum commit** — pastikan import berhasil, tidak ada syntax error
5. **Dokumentasi up-to-date** — update `docs/` setiap ada perubahan arsitektur
6. **JANGAN commit/push/deploy tanpa perintah eksplisit user** — ini bikin kerja tertunda nunggu CI. Tahan di lokal sampai user bilang "commit", "push", atau "deploy"
6. **LANGUAGE POLICY — WAJIB:**
   - ✅ **Web/Mobile UI**: Full English (menus, labels, buttons, placeholders, error messages, toasts)
   - ✅ **Code**: English (variable names, function names, comments, docstrings)
   - ✅ **LLM prompts**: English (Bedrock, TypeSafe, Sonnet)
   - ✅ **Git commits**: English (commit messages, PR descriptions)
   - ✅ **User-facing docs**: English (README, technical report, API docs)
   - ⚠️ **Street names**: Keep local Indonesian (e.g., "Jl. Lingkar Timur" — JANGAN "East Ring Road")
   - ⚠️ **Internal docs**: Boleh Bahasa Indonesia (AGENTS.md, PROGRESS.md, SPRINT_PLAN.md)
7. **Keputusan arsitektur (jangan diubah tanpa diskusi):**
   - Operator = Django template `/dashboard/` (bukan React). Warga = React PWA. PWA route `/admin` sudah dihapus.
   - Presentasi ke juri 100% dashboard + PWA; `/admin/` Django tetap hidup tapi tidak dibicarakan (login dashboard bergantung padanya).
   - Basemap gratis: CARTO Positron + Esri World Imagery + label (tanpa billing). Google hanya untuk geocoding server-side. Routing demo: OSRM publik.
   - RBAC: grup `Operator` vs `Supervisor` (custom permission `can_moderate_iqe`); user dibuat via `/admin/auth/user/`. Jangan buka gate tanpa izin tertulis.
8. **Evidence & data:**
   - JANGAN kembalikan URL `mock://` untuk user-facing — fallback dev wajib `/media/` lokal (S3 hanya di prod).
   - Koordinat demo = plot manual koridor Lingkar Timur. JANGAN klaim "GPS dari kamera" ke juri (foto tanpa EXIF GPS).
   - Foto tanpa EXIF >500m dari klaim = paksa `pending` (frontend tolak, backend override). Ambang: 0.5 km.
   - GPS wajib aktif untuk submit PWA. Status lifecycle: pending → published → acknowledged → resolved. `resolved` = sudah diperbaiki fisik (pin hilang dari peta).
9. **Defect icons (sumber tunggal):**
   - Artwork: `docs/matamu-road-defect-icons/*.svg`. Django: partial `_defect_icon.html` + `static/dashboard/icons/`. React: `public/icons/` + `DefectIcon.jsx`. JANGAN duplikat mapping, JANGAN pakai Lucide/emoji untuk kelas defect.
10. **Stack terkunci (jangan upgrade sembarang):**
    - `maplibre-gl@4.7.1` (v6 merusak Vite optimizer), Tailwind v3 (`theme()` tidak jalan di `@layer base`), font JetBrains Mono.
    - Ikon menu: `square` cap + `miter` join (tajam). Tooltip rail: custom saja (hapus atribut `title` bawaan).
11. **Sebelum klaim selesai:** render 4 halaman dashboard 200 + `node --check` untuk JS inline + `npm run build` untuk PWA + hapus `dist/` lagi.
12. **DB demo:** hanya id 3–8. Data testing WAJIB dibersihkan setelah integration test (jangan biarkan lat=0 atau duplikat).

---

## Sprint Pertama: SPRINT 0 — SETUP (21-22 Sep 2026)

### Urutan Tugas (Kerjakan Berurutan)

#### 1. Setup EC2 (krusetre) — Backend & CV Environment
**Lokasi:** SSH ke EC2 (krusetre, t2.small)
**Asumsi:** Anda sudah punya SSH access

```
Tugas:
├── Update sistem: sudo apt update && sudo apt upgrade -y
├── Install Python 3.12 + pip + venv
├── Install PostgreSQL 16 + PostGIS
│   ├── sudo apt install postgresql postgresql-contrib postgis postgresql-16-postgis-3
│   ├── sudo -u postgres createuser matamu --pwprompt
│   ├── sudo -u postgres createdb matamu --owner=matamu
│   └── sudo -u postgres psql matamu -c "CREATE EXTENSION postgis;"
├── Buat venv: python3.12 -m venv /home/ubuntu/matamu-env
├── Aktifkan: source /home/ubuntu/matamu-env/bin/activate
├── Install pip packages:
│   ├── opencv-python (versi 5.x)
│   ├── ultralytics (YOLOv11)
│   ├── django (5.x)
│   ├── django-ninja
│   ├── django-contrib-gis ( bundled dengan django )
│   ├── psycopg[binary]
│   ├── boto3 (S3)
│   └── litellm (proxy client)
└── Test:
    ├── python -c "import cv2; print(cv2.__version__)"  → harus 5.x
    ├── python -c "from ultralytics import YOLO"        → harus sukses
    └── python -c "import django; print(django.VERSION)" → harus 5.x
```

**Status:** ⬜
**Prioritas:** KRITIS — semua sprint berikutnya bergantung pada ini.

---

#### 2. Setup Local Laptop — Frontend Environment
**Lokasi:** Laptop lokal (Windows)

```
Tugas:
├── Install Node.js 22 LTS (kalau belum)
│   └── cek: node --version → harus v22.x
├── Install Git
├── cd C:\laragon\www\matamu\matamu-frontend
├── npm create vite@latest . -- --template react
├── npm install
├── npm install -D tailwindcss postcss autoprefixer
├── npx tailwindcss init -p
├── npm install maplibre-gl
├── Install PWA plugin:
│   └── npm install -D vite-plugin-pwa
└── Test:
    ├── npm run dev → buka http://localhost:5173 → harus muncul React
    └── Tailwind aktif (cek dengan class "bg-blue-500")
```

**Status:** ⬜
**Prioritas:** TINGGI — dipakai Sprint 3, tapi setup sekarang biar siap.

---

#### 3. Verifikasi Akses Bedrock + LiteLLM
**Lokasi:** SSH ke EC2

```
Tugas:
├── Test Haiku 4.5 via LiteLLM proxy:
│   curl -X POST http://localhost:4000/v1/chat/completions \
│     -H "Content-Type: application/json" \
│     -d '{"model": "bedrock-claude-haiku-4-5", "messages": [{"role": "user", "content": "Hello"}]}'
│   → harus return response dari Haiku
├── Test Bedrock Sonnet 4.5 (multimodal):
│   curl -X POST http://localhost:4000/v1/chat/completions \
│     -H "Content-Type: application/json" \
│     -d '{"model": "bedrock-claude-sonnet-4-5", "messages": [{"role": "user", "content": "Hello"}]}'
│   → harus return response dari Sonnet
└── Catat: jika ada model yang gagal, dokumentasikan di docs/deployment/model-access.md
```

**Status:** ⬜
**Prioritas:** KRITIS — Sprint 2 butuh Bedrock.

---

#### 4. Setup S3 Bucket (Evidence Storage)
**Lokasi:** AWS Console atau CLI

```
Tugas:
├── Create S3 bucket: matamu-evidence
├── Block public access (evidence tidak boleh public langsung)
├── Create IAM user: matamu-s3-access (programmatic access only)
├── Attach policy: S3 read/write ke bucket matamu-evidence only
├── Save credentials ke .env (di EC2, bukan di repo)
└── Set lifecycle policy: 30-day retention (hapus evidence lama)
```

**Status:** ⬜
**Prioritas:** SEDANG — dipakai Sprint 2.

---

#### 5. Download Dataset (RDD)
**Lokasi:** EC2 atau lokal (lalu upload ke EC2)

```
Tugas:
├── Clone/download RDD dataset:
│   https://github.com/facebookresearch/Road-Condition-Analysis
│   ATAU dari Roboflow Universe (cari "road damage" atau "pothole")
├── Simpan di: /home/ubuntu/datasets/rdd/
├── Download pothole dataset dari Roboflow:
│   └── Roboflow Universe → cari "pothole detection" → download YOLO format
├── Simpan di: /home/ubuntu/datasets/pothole/
└── Verify: cek jumlah gambar + file label (.txt)
```

**Status:** ⬜
**Prioritas:** KRITIS — Sprint 1 butuh dataset untuk training.

---

#### 6. Ambil Foto Jalan Sidoarjo (Demo Data)
**Lokasi:** Jalan Lingkar Timur, Sidoarjo (atau jalan sekitar Anda)

```
Tugas:
├── Ambil 5-10 foto kondisi jalan:
│   ├── Pothole (lubang)
│   ├── Crack (retak)
│   ├── Flooding (banjir/genangan)
│   ├── Surface degradation (rusak permukaan)
│   └── Kalau bisa: kondisi gelap, terang, hujan (variety)
├── Catat GPS setiap foto (pakai HP)
├── Simpan di: C:\laragon\www\matamu\matamu-cv\data\sidoarjo\
└── Upload ke EC2: scp ke /home/ubuntu/datasets/sidoarjo/
```

**Status:** ⬜
**Prioritas:** TINGGI — dipakai untuk test demo + evaluation evidence.

---

#### 7. Label Foto Sidoarjo
**Lokasi:** Roboflow (web) atau lokal

```
Tugas:
├── Daftar Roboflow (gratis)
├── Upload foto Sidoarjo ke project Roboflow
├── Label manual (bounding box + class):
│   ├── pothole
│   ├── longitudinal_crack
│   ├── alligator_crack
│   ├── rutting
│   ├── flooding
│   └── surface_degradation
├── Export format: YOLOv11
└── Download ke EC2: /home/ubuntu/datasets/sidoarjo-labeled/
```

**Status:** ⬜
**Prioritas:** SEDANG — untuk fine-tuning di Sprint 1.

---

#### 8. Initialize Django Project
**Lokasi:** EC2 (di dalam venv)

```
Tugas:
├── cd /home/ubuntu/
├── django-admin startproject matamu_backend matamu-backend
├── cd matamu-backend
├── python manage.py startapp api
├── python manage.py startapp observations
├── Settings:
│   ├── INSTALLED_APPS += ['django.contrib.gis', 'ninja', 'observations', 'api']
│   ├── DATABASES = PostGIS config
│   └── Set ALLOWED_HOSTS
├── python manage.py migrate
├── python manage.py createsuperuser
└── Test: python manage.py runserver 0.0.0.0:8000
    └── Buka http://EC2-IP:8000 → harus muncul Django welcome
```

**Status:** ⬜
**Prioritas:** KRITIS — Sprint 2 butuh ini.

---

## Checklist Sprint 0 — Selesai Semua?

| # | Tugas | Status | Sebelum Lanjut Sprint 1? |
|---|-------|--------|---------------------------|
| 1 | EC2: Python + OpenCV 5 + Ultralytics + Django | ⬜ | WAJIB |
| 2 | Local: Node.js + Vite + Tailwind + MapLibre | ⬜ | WAJIB (untuk S3) |
| 3 | Bedrock + LiteLLM test | ⬜ | WAJIB |
| 4 | S3 bucket + IAM | ⬜ | WAJIB |
| 5 | RDD dataset downloaded | ⬜ | WAJIB |
| 6 | 5-10 foto Sidoarjo | ⬜ | WAJIB |
| 7 | Label foto Sidoarjo | ⬜ | OPSIONAL (bisa Sprint 1 Day 1) |
| 8 | Django project init + migrate | ⬜ | WAJIB |

---

## Sprint Selanjutnya (Preview)

### SPRINT 1 (23-29 Sep) — CV Pipeline
- Fine-tune YOLOv11n di RDD (pakai Google Colab GPU gratis)
- Export ONNX → load via OpenCV 5 DNN
- SFace privacy blur
- IQE (Trust Score)
- Test dengan foto Sidoarjo

### SPRINT 2 (30 Sep-6 Okt) — Backend + Bedrock
- Django Ninja API (capture endpoint)
- Bedrock Haiku (summary) + Bedrock Sonnet 4.5 (severity)
- PostGIS geo queries
- Agentic loop (perception → decision → action)
- Django Admin sebagai operator dashboard backup

### SPRINT 3 (7-13 Okt) — PWA Frontend
- React + Vite + Tailwind PWA
- Warga: capture + my-reports + public map
- Operator: admin dashboard (map, analytics, alert, IQE, follow-up)
- MapLibre + Google Maps geocoding

### SPRINT 4 (14-20 Okt) — Agentic + Integration
- Agentic trace hardening
- Failure case documentation
- Architecture diagram
- Technical report draft

### SPRINT 5 (21-26 Okt) — Demo + Submit
- Video ≤5 menit (Gemini 3.1 Flash TTS voice-over — via LiteLLM, not severity)
- Technical report final
- Submit ke Devpost

---

## Catatan untuk AI Agent (CodeBuddy/WorkBuddy)

Ketika user minta mulai coding, kerjakan dalam urutan ini:

1. **Sprint 0 dulu** — jangan langsung coding fitur sebelum environment siap
2. **Satu tugas per eksekusi** — jangan batch terlalu banyak, biar user bisa verify
3. **Test setiap langkah** — `python -c "import X"` atau `npm run dev` sebelum lanjut
4. **Update task status** — ubah ⬜ jadi ✅ di file ini setelah selesai
5. **Error?** — cek log, dokumentasikan di `docs/deployment/issues.md`
6. **Credentials** — JANGAN PERNA commit credentials ke repo. Pakai `.env` (sudah di `.gitignore`)

---

## Tools yang Dipakai

| Tool | Versi | Untuk |
|------|-------|-------|
| Python (venv) | 3.13 (venv `matamu-backend/venv`) | Backend + CV |
| OpenCV | 5.0.0.93 | Core CV pipeline |
| Ultralytics | 8.4.159 | YOLOv11 inference |
| Django | 5.1 | Backend + Admin + Dashboard |
| Django Ninja | 1.3.0 | API layer |
| google-auth | 2.58.0 | Verifikasi ID-token PWA |
| exifr (npm) | latest | EXIF check galeri PWA |
| piexif (pip, dev-test) | 1.1.3 | Craft foto EXIF untuk spoof test |
| Node.js | 24 (dev) | Frontend build |
| Vite | 8.3.0 | PWA bundler |
| Tailwind | 3.4.19 | Styling |
| MapLibre GL | 4.7.1 (TERKUNCI) | Map rendering |
| LiteLLM | via proxy (mock lokal) | LLM proxy |
| PostgreSQL | 16 (EC2; lokal pakai SQLite) | Database |
