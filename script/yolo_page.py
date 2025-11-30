import os
from typing import Optional, Tuple

import cv2
import numpy as np

try:
    from ultralytics import YOLO
except Exception:
    YOLO = None

# Put your YOLO document detector weights here
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "doc_page.pt")

_yolo_model = None


def _load_yolo():
    """
    Lazy-load YOLO model. If anything fails, return None so the
    rest of the pipeline can still run using fallback.
    """
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    if YOLO is None:
        print("[WARN] YOLO not installed, skipping YOLO page detection.")
        return None

    if not os.path.exists(MODEL_PATH):
        print(f"[WARN] YOLO weights not found at {MODEL_PATH}, using fallback.")
        return None

    try:
        _yolo_model = YOLO(MODEL_PATH)
    except Exception as e:
        print("[WARN] Failed to load YOLO model:", e)
        _yolo_model = None

    return _yolo_model


def detect_page_yolo(img_bgr: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    """
    Returns (x1, y1, x2, y2) for detected page, or None if YOLO is
    unavailable or detection failed.
    """
    model = _load_yolo()
    if model is None:
        return None

    h, w = img_bgr.shape[:2]

    try:
        results = model.predict(source=img_bgr, verbose=False)[0]
    except Exception as e:
        print("[WARN] YOLO inference failed:", e)
        return None

    if results.boxes is None or len(results.boxes) == 0:
        return None

    # Choose the largest detected box (assumed to be the page)
    max_area = 0
    best_box = None
    for box in results.boxes.xyxy.cpu().numpy():
        x1, y1, x2, y2 = box[:4]
        area = (x2 - x1) * (y2 - y1)
        if area > max_area:
            max_area = area
            best_box = (int(x1), int(y1), int(x2), int(y2))

    if best_box is None:
        return None

    x1, y1, x2, y2 = best_box
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(w - 1, x2)
    y2 = min(h - 1, y2)

    return x1, y1, x2, y2
