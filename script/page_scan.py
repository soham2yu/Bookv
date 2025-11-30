import cv2
import numpy as np
from typing import Optional
from yolo_page import detect_page_yolo


def _order_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def _warp_from_quad(img_bgr: np.ndarray, quad: np.ndarray) -> np.ndarray:
    (tl, tr, br, bl) = quad
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxW = int(max(widthA, widthB))

    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxH = int(max(heightA, heightB))

    dst = np.array(
        [[0, 0], [maxW - 1, 0], [maxW - 1, maxH - 1], [0, maxH - 1]],
        dtype="float32",
    )

    M = cv2.getPerspectiveTransform(quad, dst)
    warped = cv2.warpPerspective(
        img_bgr,
        M,
        (maxW, maxH),
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(255, 255, 255),
    )
    return warped


def _auto_crop_contour(img_bgr: np.ndarray) -> np.ndarray:
    """
    Fallback: detect page by largest 4-point contour and warp.
    """
    h, w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)

        if len(approx) == 4 and cv2.contourArea(approx) > 0.25 * w * h:
            pts = _order_points(approx.reshape(4, 2).astype("float32"))
            warped = _warp_from_quad(img_bgr, pts)
            hh, ww = warped.shape[:2]
            y1, y2 = int(0.03 * hh), int(0.97 * hh)
            x1, x2 = int(0.03 * ww), int(0.97 * ww)
            return warped[y1:y2, x1:x2]

    # fallback if no quadrilateral found
    y1, y2 = int(0.05 * h), int(0.95 * h)
    x1, x2 = int(0.05 * w), int(0.95 * w)
    return img_bgr[y1:y2, x1:x2]


def auto_scan_page(img_bgr: np.ndarray) -> np.ndarray:
    """
    Smart page scanner:
      1. Try YOLO to get bounding box
      2. If YOLO unavailable or fails → contour-based warp
    """
    box = detect_page_yolo(img_bgr)
    if box is not None:
        x1, y1, x2, y2 = box
        crop = img_bgr[y1:y2, x1:x2].copy()
        return crop

    # fallback
    return _auto_crop_contour(img_bgr)
