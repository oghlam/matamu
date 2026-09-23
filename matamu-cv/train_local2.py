from pathlib import Path
from ultralytics import YOLO
p = Path("data/sidoarjo-labeled/data.yaml").resolve()
model = YOLO("yolo11n.pt")
# ponytail: cpu + workers=0 biar tidak hang di Windows/i5 lama, 10 epoch aja biar 2 menit
model.train(data=str(p), epochs=10, imgsz=640, batch=2, device="cpu", workers=0, project="runs", name="matamu_sidoarjo", exist_ok=True)
print("done", (Path("runs/matamu_sidoarjo/weights/best.pt").exists()))
