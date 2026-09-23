"""Test model custom Sidoarjo — harusnya muncul pothole, bukan person/car."""
from pathlib import Path
from ultralytics import YOLO

model = YOLO("models/yolo_road_v1.pt")  # bisa juga .onnx
print("classes:", model.names)

src = Path("data/sidoarjo")
out = Path("data/sidoarjo_custom_out")
out.mkdir(exist_ok=True)

for img in sorted(src.glob("lingkar-timur*.jpeg")):
    print(f"\n== {img.name} ==")
    r = model(str(img), conf=0.25, verbose=False)[0]
    if len(r.boxes)==0:
        print("  tidak ada deteksi (coba conf lebih rendah)")
    for box in r.boxes:
        cls = int(box.cls[0]); conf=float(box.conf[0])
        print(f"  {model.names[cls]} conf={conf:.2f} xyxy={box.xyxy[0].tolist()}")
    cv2 = __import__("cv2")
    cv2.imwrite(str(out / img.name), r.plot())
    print(f"  saved -> {out/img.name}")

# juga test via OpenCV DNN (bukti Sprint 1 Day 3-4)
import cv2
net = cv2.dnn.readNetFromONNX("models/yolo_road_v1.onnx")
print("\nOpenCV DNN load OK:", not net.empty())
