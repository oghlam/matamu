from ultralytics import YOLO
m = YOLO("models/yolo_road_v1.pt")
# ponytail: onnx cpu, opset 12 agar cv2.dnn kompatibel
p = m.export(format="onnx", imgsz=640, opset=12)
print("exported:", p)
