"""SFace privacy blur — YuNet detect + Gaussian blur. ponytail: no recognition, only blur."""
import cv2
from pathlib import Path

def blur_faces(img_path, out_path, score_thresh=0.6):
    img = cv2.imread(str(img_path))
    if img is None:
        return {"faces": 0, "error": "read fail"}
    h, w = img.shape[:2]
    # YuNet needs at least 320x320 expanded?
    detector = cv2.FaceDetectorYN.create(
        "models/face_detection_yunet_2023mar.onnx", "", (w, h), score_thresh, 0.3, 5000
    )
    detector.setInputSize((w, h))
    _, faces = detector.detect(img)
    count = 0
    if faces is not None:
        for det in faces:
            x, y, ww, hh = map(int, det[:4])
            x, y = max(0, x), max(0, y)
            x2, y2 = min(w, x+ww), min(h, y+hh)
            if x2<=x or y2<=y:
                continue
            roi = img[y:y2, x:x2]
            # blur strength proportional to face size, at least 15
            k = max(15, (min(ww, hh)//3) | 1)
            if k % 2 == 0:
                k += 1
            img[y:y2, x:x2] = cv2.GaussianBlur(roi, (k, k), 0)
            count += 1
    cv2.imwrite(str(out_path), img)
    return {"faces": count, "out": str(out_path)}

if __name__ == "__main__":
    src = Path("data/sidoarjo")
    out = Path("data/sidoarjo_blurred")
    out.mkdir(exist_ok=True)
    for p in sorted(src.glob("lingkar-timur*.jpeg")):
        r = blur_faces(p, out / p.name)
        print(p.name, r)
