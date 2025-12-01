"""
OCR PDF Pipeline for Bookv

Input:
    - Video file of handwritten pages

Output (in --output-dir):
    - original.pdf : image-based PDF (cleaned page images)
    - digital.pdf  : text-based PDF (typed text per page)

Dependencies (Python):
    pip install opencv-python pillow pytesseract reportlab pypdf

Also install Tesseract OCR on your system:
    Windows default path example:
        C:\\Program Files\\Tesseract-OCR\\tesseract.exe

Then set TESSERACT_CMD below if needed.
"""

import os
import sys
import argparse
from pathlib import Path
from typing import List, Tuple, Optional

import cv2
import numpy as np
from PIL import Image
import pytesseract
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from pypdf import PdfWriter, PdfReader

# ====== CONFIG ======

# If pytesseract doesn't find tesseract automatically, set path here:
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

TARGET_SAMPLE_FPS = 2          # how many frames per second to sample from video
HASH_SIZE = 16                 # for average hash (16x16 -> 256 bit)
HASH_DIFF_THRESHOLD = 40       # if hamming distance > this -> new page
MIN_PAGE_AREA_RATIO = 0.3      # page contour must occupy at least 30% of frame area

OCR_CONFIG = r"--oem 3 --psm 6"


# ====== UTILS ======

def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def average_hash(image: np.ndarray, hash_size: int = HASH_SIZE) -> np.ndarray:
    """
    Compute a simple average hash (aHash) of the given BGR image.

    Returns a flat boolean array of length hash_size*hash_size.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, (hash_size, hash_size), interpolation=cv2.INTER_AREA)
    mean = small.mean()
    return (small > mean).astype(np.uint8).flatten()


def hamming_distance(hash1: np.ndarray, hash2: np.ndarray) -> int:
    return int(np.count_nonzero(hash1 != hash2))


def extract_page_region(frame: np.ndarray) -> np.ndarray:
    """
    Try to find the biggest quadrilateral contour (page) and warp it to a flat rectangle.
    If it fails, return the original frame.
    """
    h, w = frame.shape[:2]
    frame_area = w * h

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 75, 200)

    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    max_area = 0
    page_contour = None

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < frame_area * MIN_PAGE_AREA_RATIO:
            continue

        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

        # we want roughly a quadrilateral
        if len(approx) == 4 and area > max_area:
            max_area = area
            page_contour = approx

    if page_contour is None:
        # Fallback: couldn't detect a clear page; just return original
        return frame

    pts = page_contour.reshape(4, 2).astype(np.float32)

    # order points: top-left, top-right, bottom-right, bottom-left
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top-left
    rect[2] = pts[np.argmax(s)]  # bottom-right

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left

    (tl, tr, br, bl) = rect

    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = int(max(widthA, widthB))

    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = int(max(heightA, heightB))

    # Avoid zero-size
    maxWidth = max(maxWidth, 1)
    maxHeight = max(maxHeight, 1)

    dst = np.array(
        [
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1],
        ],
        dtype=np.float32,
    )

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(frame, M, (maxWidth, maxHeight))

    return warped


def preprocess_for_ocr(page_bgr: np.ndarray) -> np.ndarray:
    """
    Basic image cleaning for OCR: grayscale, denoise, adaptive threshold.
    Returns a single-channel (grayscale) image.
    """
    gray = cv2.cvtColor(page_bgr, cv2.COLOR_BGR2GRAY)

    # Slight denoise without destroying edges
    gray = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # Adaptive threshold gives good results for uneven lighting
    th = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 10
    )

    # Optional: slight dilation to strengthen strokes
    kernel = np.ones((2, 2), np.uint8)
    th = cv2.dilate(th, kernel, iterations=1)

    return th


def frame_to_pil(img: np.ndarray) -> Image.Image:
    """
    Convert OpenCV BGR image or single-channel image to PIL Image.
    """
    if img.ndim == 2:
        return Image.fromarray(img)
    else:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        return Image.fromarray(rgb)


# ====== CORE PIPELINE ======

def extract_unique_page_frames(video_path: Path) -> List[np.ndarray]:
    """
    Read video, sample frames at ~TARGET_SAMPLE_FPS, and keep only frames where the
    average-hash distance from the last kept frame is above HASH_DIFF_THRESHOLD.

    Returns a list of BGR frames (numpy arrays).
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0  # fallback

    step = max(int(round(fps / TARGET_SAMPLE_FPS)), 1)

    page_frames: List[np.ndarray] = []
    last_hash: Optional[np.ndarray] = None

    frame_idx = 0
    grabbed = True

    while grabbed:
        grabbed, frame = cap.read()
        if not grabbed:
            break

        if frame_idx % step != 0:
            frame_idx += 1
            continue

        # Compute hash
        hsh = average_hash(frame)

        if last_hash is None:
            page_frames.append(frame)
            last_hash = hsh
        else:
            diff = hamming_distance(hsh, last_hash)
            if diff > HASH_DIFF_THRESHOLD:
                page_frames.append(frame)
                last_hash = hsh

        frame_idx += 1

    cap.release()

    return page_frames


def save_original_pdf(pages: List[np.ndarray], out_path: Path) -> None:
    """
    Save list of BGR page images to a single image-based PDF (original.pdf).
    """
    if not pages:
        raise RuntimeError("No pages to save in original.pdf")

    pil_pages = [frame_to_pil(p) for p in pages]

    first = pil_pages[0].convert("RGB")
    rest = [p.convert("RGB") for p in pil_pages[1:]]

    first.save(
        out_path,
        save_all=True,
        append_images=rest,
    )


def generate_text_pdf(page_texts: List[str], out_path: Path) -> None:
    """
    Create a simple text-only PDF using reportlab. Each element in page_texts is one page.
    """
    if not page_texts:
        raise RuntimeError("No OCR text to save in digital.pdf")

    c = canvas.Canvas(str(out_path), pagesize=A4)
    width, height = A4

    margin_x = 50
    margin_y = 50
    line_height = 14
    max_lines = int((height - 2 * margin_y) / line_height)

    for text in page_texts:
        c.setFont("Helvetica", 11)
        y = height - margin_y
        lines = text.splitlines()

        if not lines:
            lines = [" "]  # avoid empty page errors

        line_count = 0
        for line in lines:
            if line_count >= max_lines:
                c.showPage()
                c.setFont("Helvetica", 11)
                y = height - margin_y
                line_count = 0

            # Avoid super long lines going out of page (basic wrapping)
            # split into chunks of ~100 chars
            while len(line) > 100:
                part = line[:100]
                c.drawString(margin_x, y, part)
                line = line[100:]
                y -= line_height
                line_count += 1

                if line_count >= max_lines:
                    c.showPage()
                    c.setFont("Helvetica", 11)
                    y = height - margin_y
                    line_count = 0

            c.drawString(margin_x, y, line)
            y -= line_height
            line_count += 1

        c.showPage()

    c.save()


def merge_single_page_pdfs(pdf_paths: List[Path], out_path: Path) -> None:
    """
    OPTIONAL helper if you decide later to use pytesseract.image_to_pdf_or_hocr()
    per page and then merge PDFs. Not used in the main flow right now.
    """
    writer = PdfWriter()
    for p in pdf_paths:
        reader = PdfReader(str(p))
        for page in reader.pages:
            writer.add_page(page)

    with open(out_path, "wb") as f:
        writer.write(f)


def run_ocr_pipeline(video_path: Path, output_dir: Path) -> Tuple[Path, Path]:
    """
    Full pipeline:
        1. Extract unique pages from video via page-change detection
        2. Crop each frame to page region
        3. Enhance for OCR
        4. Run Tesseract OCR
        5. Save original.pdf (clean images)
        6. Save digital.pdf (typed text)
    """
    ensure_dir(output_dir)

    print(f"[INFO] Reading video: {video_path}")
    page_frames = extract_unique_page_frames(video_path)
    print(f"[INFO] Detected ~{len(page_frames)} unique pages from video")

    if not page_frames:
        raise RuntimeError("No pages detected from video. Check your video quality.")

    cropped_pages: List[np.ndarray] = []
    ocr_ready_pages: List[np.ndarray] = []
    page_texts: List[str] = []

    for i, frame in enumerate(page_frames):
        print(f"[INFO] Processing page {i+1}/{len(page_frames)}")

        # 1) Crop page
        page_bgr = extract_page_region(frame)
        cropped_pages.append(page_bgr)

        # 2) Enhance for OCR
        prep = preprocess_for_ocr(page_bgr)
        ocr_ready_pages.append(prep)

        # 3) OCR
        pil_img = frame_to_pil(prep)
        text = pytesseract.image_to_string(pil_img, config=OCR_CONFIG)
        page_texts.append(text)

    # 4) Save original.pdf (image-based)
    original_pdf_path = output_dir / "original.pdf"
    save_original_pdf(cropped_pages, original_pdf_path)
    print(f"[INFO] Saved original.pdf -> {original_pdf_path}")

    # 5) Save digital.pdf (text-based)
    digital_pdf_path = output_dir / "digital.pdf"
    generate_text_pdf(page_texts, digital_pdf_path)
    print(f"[INFO] Saved digital.pdf -> {digital_pdf_path}")

    return original_pdf_path, digital_pdf_path


# ====== CLI ENTRYPOINT ======

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bookv OCR PDF pipeline")
    parser.add_argument(
        "--video",
        type=str,
        required=True,
        help="Path to input video file",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        required=True,
        help="Directory where PDFs will be written",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    video_path = Path(args.video)
    output_dir = Path(args.output_dir)

    if not video_path.exists():
        print(f"[ERROR] Video file not found: {video_path}", file=sys.stderr)
        sys.exit(1)

    try:
        original, digital = run_ocr_pipeline(video_path, output_dir)
        # Final JSON-style print (easy to parse from Node backend)
        print(
            f'{{"original_pdf": "{original.as_posix()}", '
            f'"digital_pdf": "{digital.as_posix()}"}}'
        )
    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
