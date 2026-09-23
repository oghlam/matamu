"""Test YOLOv11n di 6 foto Sidoarjo — 1 perintah jalan."""
from pathlib import Path
from ultralytics import YOLO

# 1. model kecil (auto-download ~6MB kalau belum ada)
model = YOLO("yolo11n.pt")  # ponytail: pakai pretrained dulu, fine-tune nanti di Colab

# 2. folder foto
src = Path("data/sidoarjo")
out = Path("data/sidoarjo_out")
out.mkdir(exist_ok=True)

for img in sorted(src.glob("lingkar-timur*.jpeg")):
    print(f"\n== {img.name} ==")
    results = model(str(img), verbose=False)
    r = results[0]
    # print detections (class, conf, bbox)
    if len(r.boxes) == 0:
        print("  tidak ada deteksi (wajar — model umum belum dilatih road damage)")
    else:
        for box in r.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            name = model.names[cls]
            print(f"  {name} conf={conf:.2f}")
    # save annotated image
    annotated = r.plot()  # numpy BGR
    import cv2
    cv2.imwrite(str(out / img.name), annotated)
    print(f"  saved -> {out / img.name}")

print("\nSelesai — cek folder data/sidoarjo_out untuk lihat kotak.")
