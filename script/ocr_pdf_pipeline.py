# script/ocr_pdf_pipeline.py
import os
from typing import List, Tuple
from PIL import Image
import pytesseract  # you may remove if unused after change

from ocr_engines import run_ocr, OcrEngineName
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

# If tesseract is not on PATH, set pytesseract.pytesseract.tesseract_cmd here
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def ocr_image(image_path: str, lang: str = "eng", engine: OcrEngineName = "paddle") -> str:
    """
    Run OCR on single image using selected engine.
    engine = "paddle" (better handwriting) or "tesseract".
    """
    img = Image.open(image_path)
    text = run_ocr(img, engine=engine, lang=lang)
    return text


def generate_original_pdf(image_paths: List[str], output_pdf_path: str) -> None:
    """
    Create image-only PDF ("original", like scan).
    """
    if not image_paths:
        raise ValueError("No images provided for original PDF.")

    pil_images = [Image.open(p).convert("RGB") for p in image_paths]
    first = pil_images[0]
    rest = pil_images[1:]

    first.save(
        output_pdf_path,
        save_all=True,
        append_images=rest,
        format="PDF",
    )


def generate_text_pdf(text_pages: List[str], output_pdf_path: str) -> None:
    """
    Create text-only digital PDF (searchable).
    Each element of text_pages is content for one page.
    """
    if not text_pages:
        raise ValueError("No text pages for digital PDF.")

    page_width, page_height = A4
    c = canvas.Canvas(output_pdf_path, pagesize=A4)

    for page_text in text_pages:
        text_obj = c.beginText()
        # margin
        text_obj.setTextOrigin(40, page_height - 60)
        text_obj.setFont("Helvetica", 11)

        for line in page_text.splitlines():
            # simple line wrapping
            if len(line) > 100:
                while len(line) > 100:
                    text_obj.textLine(line[:100])
                    line = line[100:]
            text_obj.textLine(line)
        c.drawText(text_obj)
        c.showPage()

    c.save()


def ocr_frames_to_pdfs(
    frame_paths: List[str],
    output_dir: str,
    lang: str = "eng",
) -> Tuple[str, str]:
    """
    full pipeline:
      - OCR each frame
      - generate original.pdf and digital.pdf
    """
    os.makedirs(output_dir, exist_ok=True)

    text_pages: List[str] = []
    for idx, frame_path in enumerate(sorted(frame_paths)):
        print(f"OCR frame {idx+1}/{len(frame_paths)}: {frame_path}", flush=True)
        text = ocr_image(frame_path, lang=lang, engine="paddle")
        text_pages.append(text)

    original_pdf_path = os.path.join(output_dir, "original.pdf")
    digital_pdf_path = os.path.join(output_dir, "digital.pdf")

    generate_original_pdf(frame_paths, original_pdf_path)
    generate_text_pdf(text_pages, digital_pdf_path)

    return original_pdf_path, digital_pdf_path
