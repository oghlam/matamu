# Dataset — RDD + Pothole + Sidoarjo

## Sources Used (Sprint 1)

| Dataset | Source | Format |
|---------|--------|--------|
| RDD2022 (Japan/India road damage) | `sekilab/RoadDamageDetector` (GRDDC) | YOLO — download via Roboflow atau GitHub release |
| Pothole (Roboflow Universe) | Search for "pothole detection" on universe.roboflow.com | YOLOv11 |
| Sidoarjo demo (5–10 photos) | Locally captured on Jl. Lingkar Timur | YOLOv11 (manual labels) |

> Note: `facebookresearch/Road-Condition-Analysis` is not the valid source reference; use `sekilab/RoadDamageDetector`.

## Download (local first, then copy to EC2)

```bash
# 1) RDD2022 — via Roboflow (paling gampang) atau GitHub release
# Roboflow: https://universe.roboflow.com/sekilab/generic-road-damage-detection

# 2) store locally
C:\laragon\www\matamu\matamu-cv\data\rdd\
C:\laragon\www\matamu\matamu-cv\data\pothole\
C:\laragon\www\matamu\matamu-cv\data\sidoarjo\        # raw photos + GPS

# 3) upload to EC2
scp -i <key.pem> -r matamu-cv/data/rdd ubuntu@<EC2_IP>:/home/ubuntu/datasets/rdd/
scp -i <key.pem> -r matamu-cv/data/sidoarjo ubuntu@<EC2_IP>:/home/ubuntu/datasets/sidoarjo/
```

## Sidoarjo Photos (S0-6)

- 5–10 photos: pothole, crack, flooding, and surface degradation
- Vary lighting and weather conditions when possible
- Record GPS using the phone location or photo EXIF data
- Store them in `matamu-cv/data/sidoarjo/`; preserve EXIF during dataset preparation

## Labeling (S0-7) — Roboflow

1. Create a Roboflow project → Object Detection
2. Upload Sidoarjo photos and label bounding boxes and classes:
   `pothole, longitudinal_crack, alligator_crack, rutting, flooding, surface_degradation`
3. Export as YOLOv11 and download to `matamu-cv/data/sidoarjo-labeled/`
4. This step may be deferred to Sprint 1 Day 1.
