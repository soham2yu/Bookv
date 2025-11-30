import os
import cv2
import numpy as np

# Put a super-res model here, e.g. EDSR_x2.pb downloaded from OpenCV model zoo
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "EDSR_x2.pb")

_sr = None

def _load_superres():
    global _sr
    if _sr is not None:
        return _sr
    if not os.path.exists(MODEL_PATH):
        return None
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(MODEL_PATH)
    sr.setModel("edsr", 2)   # 2x upscaling
    _sr = sr
    return _sr


def apply_superres(img: np.ndarray) -> np.ndarray:
    """
    Upscale image using super-resolution if model is available.
    Otherwise return original image.
    """
    sr = _load_superres()
    if sr is None:
        return img
    try:
        return sr.upsample(img)
    except Exception:
        return img
