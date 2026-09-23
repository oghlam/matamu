"""CV pipeline wrapper — import dari matamu-cv (YOLO + SFace + IQE).

ponytail: path resolve relative to repo root, graceful import error kalau
opencv/ultralytics belum install di env lokal (dev bisa run tanpa CV).
"""
import sys
import os
import logging
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

# matamu-cv ada satu level di atas matamu-backend
_CV_DIR = Path(__file__).resolve().parents[2] / "matamu-cv"
if str(_CV_DIR) not in sys.path:
    sys.path.insert(0, str(_CV_DIR))

# model path default (ONNX via cv2.dnn for EC2, .pt for local)
_MODEL_PT = _CV_DIR / "models" / "yolo26_best.pt"
_YUNET = _CV_DIR / "models" / "face_detection_yunet_2023mar.onnx"

# lazy-load: import sekali, reuse
_yolo = None
_cv_available = None


def _load_yolo():
    global _yolo, _cv_available
    if _cv_available is not None:
        return _cv_available
    try:
        from ultralytics import YOLO
        if _MODEL_PT.exists():
            _yolo = YOLO(str(_MODEL_PT))
            _cv_available = True
        else:
            logger.warning("cv_pipeline: model not found at %s", _MODEL_PT)
            _cv_available = False
    except Exception as e:
        logger.warning("cv_pipeline: ultralytics unavailable — %s", e)
        _cv_available = False
    return _cv_available


def run_cv(img_path: str | Path) -> dict:
    """Run YOLO + IQE on img_path. Returns detection dict.

    {
        "detections": [{"class": str, "confidence": float, "bbox": [x,y,w,h]}],
        "trust": float,
        "status": "published" | "pending_verification",
        "blur": float,
        "brightness": float,
    }
    Falls back to mock if CV not available.
    """
    img_path = Path(img_path)

    if not _load_yolo():
        logger.warning("cv_pipeline: CV unavailable, returning mock result")
        return _mock_result()

    try:
        from iqe import iqe_for_image

        results = _yolo(str(img_path), conf=0.25, verbose=False)[0]
        detections = []
        confs = []
        for box in results.boxes:
            cls_idx = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            x, y, x2, y2 = xyxy
            detections.append({
                "class": results.names[cls_idx],
                "confidence": round(conf, 3),
                "bbox": [round(x), round(y), round(x2-x), round(y2-y)],
            })
            confs.append(conf)

        iqe = iqe_for_image(img_path, confs or None) or {}
        return {
            "detections": detections,
            "trust": iqe.get("trust", 0.5),
            "status": iqe.get("status", "pending_verification"),
            "blur": iqe.get("blur", 0.0),
            "brightness": iqe.get("brightness", 0.0),
        }
    except Exception as e:
        logger.error("cv_pipeline: run_cv error — %s", e)
        return _mock_result()


def blur_faces_for(img_path: str | Path, out_path: str | Path) -> int:
    """Apply SFace blur. Returns face count. Copies file if CV unavailable."""
    img_path, out_path = Path(img_path), Path(out_path)

    if not _YUNET.exists():
        import shutil
        shutil.copy2(img_path, out_path)
        return 0
    try:
        import cv2
        import shutil
        img = cv2.imread(str(img_path))
        if img is None:
            shutil.copy2(img_path, out_path)
            return 0
        h, w = img.shape[:2]
        detector = cv2.FaceDetectorYN.create(str(_YUNET), "", (w, h), 0.6, 0.3, 5000)
        detector.setInputSize((w, h))
        _, faces = detector.detect(img)
        count = 0
        if faces is not None:
            for det in faces:
                x, y, ww, hh = map(int, det[:4])
                x, y = max(0, x), max(0, y)
                x2, y2 = min(w, x + ww), min(h, y + hh)
                if x2 <= x or y2 <= y:
                    continue
                roi = img[y:y2, x:x2]
                k = max(15, (min(ww, hh) // 3) | 1)
                if k % 2 == 0:
                    k += 1
                img[y:y2, x:x2] = cv2.GaussianBlur(roi, (k, k), 0)
                count += 1
        cv2.imwrite(str(out_path), img)
        return count
    except Exception as e:
        logger.warning("blur_faces_for error: %s — copying original", e)
        import shutil
        shutil.copy2(img_path, out_path)
        return 0


def _mock_result() -> dict:
    """Mock CV result for local dev without ultralytics."""
    return {
        "detections": [{"class": "pothole", "confidence": 0.70, "bbox": [0, 0, 100, 100]}],
        "trust": 0.70,
        "status": "published",
        "blur": 120.0,
        "brightness": 130.0,
    }
