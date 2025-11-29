import cv2
import os
import sys
import uuid
import pytesseract
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

# Simple config – you can later move to .env
BASE_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "server_output")
os.makedirs(BASE_OUTPUT_DIR, exist_ok=True)

def extract_frames(video_path, frames_dir, frame_interval=15):
    """
    Extract frames every `frame_interval` frames from the video.
    This is a simple heuristic: later you can replace with better page detection.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError("Could not open video file")

    frame_count = 0
    saved_count = 0

    os.makedirs(frames_dir, exist_ok=True)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            # Enhance: convert to grayscale & apply blur/threshold if needed
            frame_path = os.path.join(frames_dir, f"page_{saved_count:03d}.png")
            cv2.imwrite(frame_path, frame)
            saved_count += 1

        frame_count += 1

    cap.release()
    return saved_count


def build_original_pdf(frames_dir, output_pdf_path):
    """
    Take all page_*.png images and build a 'scanned' original PDF.
    """
    # Get sorted list of image files
    files = sorted(
        f for f in os.listdir(frames_dir) if f.lower().endswith(".png")
    )
    if not files:
        raise RuntimeError("No frames found to build original PDF")

    first_image_path = os.path.join(frames_dir, files[0])
    first_image = Image.open(first_image_path)
    width, height = first_image.size

    c = canvas.Canvas(output_pdf_path, pagesize=(width, height))

    for fname in files:
        img_path = os.path.join(frames_dir, fname)
        c.drawImage(img_path, 0, 0, width=width, height=height)
        c.showPage()

    c.save()


def ocr_image(image_path):
    """
    Basic OCR on one image using pytesseract.
    You can tune config for better handwritten support.
    """
    img = Image.open(image_path).convert("L")  # grayscale
    # Simple threshold can help
    # img = img.point(lambda x: 0 if x < 128 else 255, "1")
    text = pytesseract.image_to_string(img, lang="eng")
    return text


def build_digital_pdf(frames_dir, output_pdf_path):
    """
    Run OCR on each frame and write text pages to a 'digital' PDF.
    For simplicity: we create a text-only PDF (not overlay).
    """
    files = sorted(
        f for f in os.listdir(frames_dir) if f.lower().endswith(".png")
    )
    if not files:
        raise RuntimeError("No frames found to build digital PDF")

    page_width, page_height = A4
    c = canvas.Canvas(output_pdf_path, pagesize=A4)

    for fname in files:
        img_path = os.path.join(frames_dir, fname)
        text = ocr_image(img_path)

        # Simple multi-line text writer
        c.setFont("Helvetica", 10)
        margin = 40
        y = page_height - margin
        for line in text.splitlines():
            if not line.strip():
                y -= 14
                continue
            c.drawString(margin, y, line[:200])  # avoid overflow
            y -= 14
            if y < margin:
                c.showPage()
                c.setFont("Helvetica", 10)
                y = page_height - margin

        c.showPage()

    c.save()


def process_video(video_path: str):
    """
    Main function:
    - Create job directory
    - Extract frames
    - Generate original.pdf & digital.pdf
    - Print JSON-like info to stdout for Node backend to read
    """
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(BASE_OUTPUT_DIR, job_id)
    frames_dir = os.path.join(job_dir, "frames")
    os.makedirs(job_dir, exist_ok=True)

    print(f"[processor] Starting job {job_id}", file=sys.stderr)

    # 1) Extract frames
    num_frames = extract_frames(video_path, frames_dir, frame_interval=15)
    if num_frames == 0:
        raise RuntimeError("No frames extracted from video")

    # 2) Build original PDF
    original_pdf = os.path.join(job_dir, "original.pdf")
    build_original_pdf(frames_dir, original_pdf)

    # 3) Build digital PDF (with OCR)
    digital_pdf = os.path.join(job_dir, "digital.pdf")
    build_digital_pdf(frames_dir, digital_pdf)

    # 4) Return paths as a simple line that Node can parse as JSON
    result = {
        "jobId": job_id,
        "originalPdf": original_pdf,
        "digitalPdf": digital_pdf,
        "framesDir": frames_dir,
        "framesCount": num_frames,
    }

    import json
    print(json.dumps(result))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python processor.py <video_path>", file=sys.stderr)
        sys.exit(1)

    video_path = sys.argv[1]
    if not os.path.exists(video_path):
        print(f"File not found: {video_path}", file=sys.stderr)
        sys.exit(1)

    process_video(video_path)
