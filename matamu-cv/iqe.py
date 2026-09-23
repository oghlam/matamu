"""IQE Trust Score — Detection Confidence + Inspection Quality (blur, lighting, GPS)."""
import cv2
from pathlib import Path

def blur_score(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()

def brightness(img):
    # mean V in HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    return float(hsv[:, :, 2].mean())

def iqe_for_image(img_path, detection_confs=None, gps_accuracy=None):
    img = cv2.imread(str(img_path))
    if img is None:
        return None
    b = blur_score(img)
    br = brightness(img)
    det_conf = sum(detection_confs)/len(detection_confs) if detection_confs else 0.0
    # normalized sub-scores 0-1
    blur_ok = min(1.0, b / 100.0)  # IQE_BLUR_SCORE_MIN=100
    light_ok = 1.0 if 50 <= br <= 200 else max(0.0, 1 - abs(br-125)/125)
    gps_ok = 1.0 if gps_accuracy is None else max(0.0, 1 - gps_accuracy/25)
    # weighted trust: det 0.5, blur 0.2, light 0.2, gps 0.1 (gps None => use 1.0 weight but not penalize)
    trust = 0.5*det_conf + 0.2*blur_ok + 0.2*light_ok + 0.1*gps_ok
    status = "published" if trust >= 0.65 else "pending_verification"
    return {
        "blur": round(b, 1),
        "brightness": round(br, 1),
        "det_conf": round(det_conf, 3),
        "trust": round(trust, 3),
        "status": status,
    }

if __name__ == "__main__":
    from ultralytics import YOLO
    m = YOLO("models/yolo26_best.pt")
    for p in sorted(Path("data/sidoarjo").glob("lingkar-timur*.jpeg")):
        r = m(str(p), conf=0.25, verbose=False)[0]
        confs = [float(b.conf[0]) for b in r.boxes]
        print(p.name, iqe_for_image(p, confs, gps_accuracy=None))
