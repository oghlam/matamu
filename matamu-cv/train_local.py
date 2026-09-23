from pathlib import Path
import yaml

# fix paths in data.yaml to absolute
p = Path("data/sidoarjo-labeled/data.yaml")
data = yaml.safe_load(p.read_text())
root = p.resolve().parent
data["train"] = str(root / "train" / "images")
data["val"] = str(root / "valid" / "images")
# test optional
if "test" in data:
    del data["test"]
# remove roboflow key for cleaner
p.write_text(yaml.safe_dump(data))
print("fixed data.yaml:")
print(Path(p).read_text())

from ultralytics import YOLO
model = YOLO("yolo11n.pt")
# ponytail: 20 epoch cukup untuk 6 foto demo, imgsz 640 biar sama dengan export
model.train(data=str(p.resolve()), epochs=20, imgsz=640, batch=2, device="cpu", project="runs", name="matamu_sidoarjo", exist_ok=True, verbose=False)
print("\nTrain selesai — best.pt di runs/matamu_sidoarjo/weights/best.pt")
