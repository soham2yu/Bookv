"""
OCR + PDF Pipeline for BookVision (Bookv)

Input:
    - Video of pages (mp4, avi, mov, etc.)
    - OR a folder of page images
    - OR a single image

Output (in --output-dir):
    - original.pdf : image-based PDF (scanned look)
    - digital.pdf  : searchable PDF (text layer from OCR)

Requirements:
    pip install opencv-python pillow pytesseract reportlab PyPDF2 numpy

Notes:
    - Set TESSERACT_CMD if needed, e.g.:
        pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
"""

import argparse
import os
import sys
import tempfile
import shutil
import io
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
from PIL import Image
import pytesseract
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from PyPDF2 import PdfReader, PdfWriter


# --------- Utils ---------

VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


def log(*args):
    print("[OCR_PIPELINE]", *args, flush=True)


def is_video(path: Path) -> bool:
    return path.suffix.lower() in VIDEO_EXTS


def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


# --------- Step 1: Extract frames if video ---------

def extract_frames_from_video(
    video_path: Path,
    frames_dir: Path,
    frame_step: int = 8,
) -> List[Path]:
    """
    Extract every Nth frame from video into frames_dir.
    Returns sorted list of image paths.
    """
    log("Extracting frames from video:", video_path)
    ensure_dir(frames_dir)
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    frame_paths: List[Path] = []
    index = 0
    saved = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if index % frame_step == 0:
            img_name = f"frame_{index:06d}.jpg"
            img_path = frames_dir / img_name
            cv2.imwrite(str(img_path), frame)
            frame_paths.append(img_path)
            saved += 1
        index += 1

    cap.release()
    log(f"Extracted {saved} frames.")
    return frame_paths


# --------- Step 2: Page detection + perspective fix ---------

def sort_points(pts: np.ndarray) -> np.ndarray:
    """
    Sort 4 points into [top-left, top-right, bottom-right, bottom-left].
    """
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)

    rect[0] = pts[np.argmin(s)]      # top-left
    rect[2] = pts[np.argmax(s)]      # bottom-right
    rect[1] = pts[np.argmin(diff)]   # top-right
    rect[3] = pts[np.argmax(diff)]   # bottom-left
    return rect


def four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """
    Perspective transform to A4-ish aspect ratio.
    """
    rect = sort_points(pts)
    (tl, tr, br, bl) = rect

    # Width = max of top and bottom edges
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = int(max(widthA, widthB))

    # Height = max of left and right edges
    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = int(max(heightA, heightB))

    # Target ratio ~ A4 (1:1.414)
    A4_RATIO = 1.414
    targetHeight = int(maxWidth * A4_RATIO)

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, targetHeight - 1],
        [0, targetHeight - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, targetHeight))
    return warped


def detect_and_warp_page(image: np.ndarray) -> np.ndarray:
    """
    Detect the largest 4-point contour (page) and warp it.
    Fallback: return resized image if detection fails.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    page_contour = None
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            page_contour = approx.reshape(4, 2)
            break

    if page_contour is not None:
        warped = four_point_transform(image, page_contour)
        return warped

    # Fallback: just resize to A4-like page
    log("Page contour not found, using fallback resize.")
    h, w = image.shape[:2]
    target_w = 1240
    target_h = int(target_w * 1.414)
    return cv2.resize(image, (target_w, target_h))


# --------- Step 3: Near-duplicate removal ---------

def is_similar(img_a: np.ndarray, img_b: np.ndarray, threshold: float = 3.0) -> bool:
    """
    Simple perceptual similarity: downscale, compare mean absolute diff.
    """
    a = cv2.resize(img_a, (32, 32))
    b = cv2.resize(img_b, (32, 32))
    a = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY)
    b = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    diff = np.mean(np.abs(a.astype("float32") - b.astype("float32")))
    return diff < threshold


def filter_unique_pages(images: List[np.ndarray]) -> List[np.ndarray]:
    """
    Remove near-duplicate consecutive pages.
    """
    if not images:
        return []

    unique = [images[0]]
    for img in images[1:]:
        if not is_similar(unique[-1], img):
            unique.append(img)
    log(f"Filtered pages: {len(images)} -> {len(unique)} (deduped)")
    return unique


# --------- Step 4: Build PDFs ---------

def build_original_pdf(page_images: List[Image.Image], output_path: Path):
    """
    Build image-only PDF (original look).
    """
    log("Building original.pdf at", output_path)
    c = canvas.Canvas(str(output_path), pagesize=A4)
    page_w, page_h = A4

    for idx, pil_img in enumerate(page_images):
        # Fit image into A4 preserving aspect ratio
        img_w, img_h = pil_img.size
        ratio = min(page_w / img_w, page_h / img_h)
        draw_w = img_w * ratio
        draw_h = img_h * ratio
        x = (page_w - draw_w) / 2
        y = (page_h - draw_h) / 2

        temp_buf = io.BytesIO()
        pil_img.save(temp_buf, format="JPEG", quality=95)
        temp_buf.seek(0)

        c.drawImage(ImageReader(temp_buf), x, y, width=draw_w, height=draw_h)
        c.showPage()

    c.save()
    log("original.pdf created.")


def build_digital_pdf(page_images: List[Image.Image], output_path: Path):
    """
    Build searchable PDF by using pytesseract's PDF output and merging.
    """
    log("Building digital.pdf at", output_path)
    writer = PdfWriter()

    for idx, pil_img in enumerate(page_images):
        log(f"OCR on page {idx + 1}/{len(page_images)}")
        # Ensure RGB
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        pdf_bytes = pytesseract.image_to_pdf_or_hocr(
            pil_img,
            extension="pdf",
            config="--oem 3 --psm 1"
        )
        pdf_stream = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_stream)
        for page in reader.pages:
            writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

    log("digital.pdf created.")


# ReportLab ImageReader (import after PIL)
from reportlab.lib.utils import ImageReader


# --------- Main pipeline ---------

def load_images_from_folder(folder: Path) -> List[Path]:
    exts = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}
    all_files = sorted(folder.iterdir())
    return [p for p in all_files if p.suffix.lower() in exts]


def run_pipeline(input_path: Path, output_dir: Path):
    ensure_dir(output_dir)

    tmp_dir = Path(tempfile.mkdtemp(prefix="bookvision_"))
    log("Temporary working dir:", tmp_dir)

    try:
        if input_path.is_dir():
            frame_paths = load_images_from_folder(input_path)
        elif is_video(input_path):
            frames_dir = tmp_dir / "frames"
            frame_paths = extract_frames_from_video(input_path, frames_dir)
        else:
            # single image
            ensure_dir(tmp_dir / "frames")
            img = cv2.imread(str(input_path))
            if img is None:
                raise RuntimeError(f"Cannot read image: {input_path}")
            single_path = tmp_dir / "frames" / "frame_000000.jpg"
            cv2.imwrite(str(single_path), img)
            frame_paths = [single_path]

        if not frame_paths:
            raise RuntimeError("No frames/images found to process.")

        # 1) Detect page + warp
        warped_pages: List[np.ndarray] = []
        for fp in frame_paths:
            log("Processing frame:", fp)
            img = cv2.imread(str(fp))
            if img is None:
                log("WARNING: cannot read frame", fp)
                continue
            page = detect_and_warp_page(img)
            warped_pages.append(page)

        if not warped_pages:
            raise RuntimeError("No valid pages after processing.")

        # 2) Deduplicate pages
        unique_pages = filter_unique_pages(warped_pages)

        # 3) Convert to PIL for PDF building
        pil_pages: List[Image.Image] = []
        for page in unique_pages:
            page_rgb = cv2.cvtColor(page, cv2.COLOR_BGR2RGB)
            pil_pages.append(Image.fromarray(page_rgb))

        # 4) Build PDFs
        original_pdf_path = output_dir / "original.pdf"
        digital_pdf_path = output_dir / "digital.pdf"

        build_original_pdf(pil_pages, original_pdf_path)
        build_digital_pdf(pil_pages, digital_pdf_path)

        log("Pipeline complete.")
        log("original.pdf ->", original_pdf_path)
        log("digital.pdf  ->", digital_pdf_path)

    finally:
        # Cleanup temp
        shutil.rmtree(tmp_dir, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description="BookVision OCR PDF Pipeline")
    parser.add_argument(
        "--input",
        "-i",
        required=True,
        help="Path to video, folder of images, or single image.",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        required=True,
        help="Directory to write original.pdf and digital.pdf",
    )
    parser.add_argument(
        "--tesseract-cmd",
        help="Optional path to tesseract executable",
    )
    args = parser.parse_args()

    input_path = Path(args.input).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()

    if args.tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = args.tesseract_cmd

    if not input_path.exists():
        log("ERROR: input path does not exist:", input_path)
        sys.exit(1)

    run_pipeline(input_path, output_dir)


if __name__ == "__main__":
    main()
