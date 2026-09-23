# Dataset — RDD + Pothole + Sidoarjo

## Sumber yang dipakai (Sprint 1)

| Dataset | Sumber | Format |
|---------|--------|--------|
| RDD2022 (Japan/India road damage) | `sekilab/RoadDamageDetector` (GRDDC) | YOLO — download via Roboflow atau GitHub release |
| Pothole (Roboflow Universe) | cari "pothole detection" di universe.roboflow.com | YOLOv11 |
| Sidoarjo demo (5-10 foto) | ambil sendiri Jl. Lingkar Timur | YOLOv11 (label manual) |

> Catatan: `facebookresearch/Road-Condition-Analysis` tidak ada — yang benar `sekilab/RoadDamageDetector`.

## Download (lokal dulu, lalu scp ke EC2)

```bash
# 1) RDD2022 — via Roboflow (paling gampang) atau GitHub release
# Roboflow: https://universe.roboflow.com/sekilab/generic-road-damage-detection

# 2) simpan lokal
C:\laragon\www\matamu\matamu-cv\data\rdd\
C:\laragon\www\matamu\matamu-cv\data\pothole\
C:\laragon\www\matamu\matamu-cv\data\sidoarjo\        # foto mentah + GPS

# 3) upload ke EC2
scp -i <key.pem> -r matamu-cv/data/rdd ubuntu@<EC2_IP>:/home/ubuntu/datasets/rdd/
scp -i <key.pem> -r matamu-cv/data/sidoarjo ubuntu@<EC2_IP>:/home/ubuntu/datasets/sidoarjo/
```

## Foto Sidoarjo (S0-6)

- 5-10 foto: pothole, crack, flooding, surface degradation
- Vary: terang/gelap/hujan jika bisa
- Catat GPS (HP → share location / foto EXIF)
- Simpan di `matamu-cv/data/sidoarjo/` — EXIF jangan dihapus (dibaca IQE)

## Labeling (S0-7) — Roboflow

1. Buat project di Roboflow (gratis) → type Object Detection
2. Upload foto Sidoarjo → label bbox + class:
   `pothole, longitudinal_crack, alligator_crack, rutting, flooding, surface_degradation`
3. Export → YOLOv11 → download ke `matamu-cv/data/sidoarjo-labeled/`
4. Bisa ditunda ke Sprint 1 Day 1 (opsional di S0)
