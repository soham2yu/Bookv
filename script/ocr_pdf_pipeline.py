import os
import json
from typing import List
import cv2
import numpy as np
import imagehash
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from paddleocr import PaddleOCR
import pytesseract
import re
import imutils

# --------------------------------------------------------------------
# BLUR DETECTION
# --------------------------------------------------------------------
def is_blurry(img, threshold=120):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    fm = cv2.Laplacian(gray, cv2.CV_64F).var()
    return fm < threshold

# --------------------------------------------------------------------
# AUTO ROTATION
# --------------------------------------------------------------------
def auto_rotate(image):
    try:
        osd = pytesseract.image_to_osd(image)
        angle = int(re.search(r"(?<=Rotate: )\d+", osd).group(0))
        return imutils.rotate_bound(image, 360 - angle)
    except:
        return image

# --------------------------------------------------------------------
# DEDUPLICATION
# --------------------------------------------------------------------
def deduplicate_frames(paths: List[str], threshold: int = 5) -> List[str]:
    unique = []
    prev_hash = None
    for p in paths:
        try:
            h = imagehash.average_hash(Image.open(p).convert("L"))
        except:
            continue
        if prev_hash is None or abs(h - prev_hash) > threshold:
            unique.append(p)
            prev_hash = h
    return unique

# --------------------------------------------------------------------
# PREPROCESSING
# --------------------------------------------------------------------
def preprocess_image(path):
    img = cv2.imread(path)
    if img is None:
        return None

    if is_blurry(img):
        print("[WARN] Skipping blurry frame:", path)
        return None

    img = auto_rotate(img)
    img = cv2.resize(img, None, fx=1.3, fy=1.3, interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )

    return binary

def preprocess_and_save(paths):
    processed = []
    for p in paths:
        img = preprocess_image(p)
        if img is None:
            continue
        base = os.path.basename(p)
        out_path = os.path.join(os.path.dirname(p), f"{base}_proc.png")
        cv2.imwrite(out_path, img)
        processed.append(out_path)
    return processed

# --------------------------------------------------------------------
# OCR (Paddle + Tesseract)
# --------------------------------------------------------------------
def run_ocr(processed_paths):
    ocr = PaddleOCR(use_angle_cls=True, lang="en", ocr_version="PP-OCRv4", drop_score=0.25)
    results = []

    for p in processed_paths:
        lines = []

        # Tesseract for printed material
        text_tess = pytesseract.image_to_string(Image.open(p), lang="eng")
        for line in text_tess.split("\n"):
            if line.strip():
                lines.append(line.strip())

        # PaddleOCR for handwriting
        res = ocr.ocr(p, cls=True)
        if res and res[0]:
            for box, (text, score) in res[0]:
                if score >= 0.25:
                    lines.append(text.strip())

        results.append(lines)

    return results

# --------------------------------------------------------------------
# PDF BUILDERS
# --------------------------------------------------------------------
def build_original_pdf(image_paths, output_path):
    pil_images = []
    for p in image_paths:
        img = cv2.imread(p)
        if img is None:
            continue
        img = auto_rotate(img)
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_images.append(Image.fromarray(rgb))

    pil_images[0].save(output_path, save_all=True, append_images=pil_images[1:])

def build_digital_pdf(original_paths, ocr_lines, output_path):
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    for img, lines in zip(original_paths, ocr_lines):
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, height - 40, os.path.basename(img))

        c.setFont("Helvetica", 10)
        text_obj = c.beginText(40, height - 70)

        for line in lines:
            if text_obj.getY() < 80:
                c.drawText(text_obj)
                c.showPage()
                text_obj = c.beginText(40, height - 70)
            text_obj.textLine(line)

        c.drawText(text_obj)
        c.showPage()

    c.save()

# --------------------------------------------------------------------
# MAIN FUNCTION
# --------------------------------------------------------------------
def ocr_frames_to_pdfs(frame_paths, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    unique = deduplicate_frames(frame_paths)
    processed = preprocess_and_save(unique)
    if not processed:
        return {"success": False, "error": "No frames processed"}

    ocr_lines = run_ocr(processed)

    original_pdf = os.path.join(output_dir, "original.pdf")
    digital_pdf = os.path.join(output_dir, "digital.pdf")

    build_original_pdf(unique, original_pdf)
    build_digital_pdf(unique, ocr_lines, digital_pdf)

    return {
        "success": True,
        "original_pdf": original_pdf,
        "digital_pdf": digital_pdf,
        "num_frames": len(frame_paths),
        "num_unique": len(unique)
    }
