"""Sprint 1 Day 7 — Full CV pipeline validate 6 foto Sidoarjo."""
from pathlib import Path
import cv2
from ultralytics import YOLO
from sface_blur import blur_faces
from iqe import iqe_for_image

model = YOLO("models/yolo26_best.pt")
onnx_net = cv2.dnn.readNetFromONNX("models/yolo_road_v1.onnx") if Path("models/yolo_road_v1.onnx").exists() else None
# use public ONNX if available else pt's onnx
if onnx_net is None or onnx_net.empty():
    # export public to onnx quickly if missing
    model.export(format="onnx", imgsz=640, opset=12)
    onnx_net = cv2.dnn.readNetFromONNX("models/yolo26_best.onnx")

print("OpenCV DNN:", not onnx_net.empty(), "cv2", cv2.__version__)

for p in sorted(Path("data/sidoarjo").glob("lingkar-timur*.jpeg")):
    # 1. YOLO
    r = model(str(p), conf=0.25, verbose=False)[0]
    confs = [float(b.conf[0]) for b in r.boxes]
    # 2. SFace
    blur_out = Path("data/sidoarjo_blurred") / p.name
    faces = blur_faces(p, blur_out)["faces"]
    # 3. IQE
    iqe = iqe_for_image(p, confs)
    print(f"{p.name}: det={len(confs)} faces_blurred={faces} {iqe}")
