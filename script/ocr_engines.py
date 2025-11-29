# script/ocr_engines.py
from typing import Literal
from PIL import Image
import numpy as np
import pytesseract

try:
    from paddleocr import PaddleOCR  # type: ignore
except ImportError:
    PaddleOCR = None  # type: ignore


OcrEngineName = Literal["tesseract", "paddle"]

_paddle_ocr = None  # global lazy instance


def get_paddle_ocr():
    global _paddle_ocr, PaddleOCR
    if PaddleOCR is None:
        raise RuntimeError(
            "PaddleOCR is not installed. Run `pip install paddlepaddle paddleocr` in your ocrenv."
        )
    if _paddle_ocr is None:
        # lang 'en' should work for English + many Latin scripts
        # use_angle_cls improves rotated text
        _paddle_ocr = PaddleOCR(use_angle_cls=True, lang="en")
    return _paddle_ocr


def tesseract_ocr(image: Image.Image, lang: str = "eng") -> str:
    """OCR using Tesseract (printed + some handwriting, fast)."""
    # basic preprocessing already done by video_to_frames; ensure grayscale
    if image.mode != "L":
        image = image.convert("L")
    text = pytesseract.image_to_string(image, lang=lang)
    return text


def paddle_ocr(image: Image.Image) -> str:
    """
    OCR using PaddleOCR (better for handwriting and complex layouts).
    Returns plain text joined by line.
    """
    ocr = get_paddle_ocr()

    # Paddle expects numpy array (BGR or RGB). We'll give RGB.
    if image.mode != "RGB":
        rgb = image.convert("RGB")
    else:
        rgb = image
    img_np = np.array(rgb)

    result = ocr.ocr(img_np, cls=True)
    # result is list[ list[ (box, (text, score)) ] ]
    lines: list[str] = []
    for page in result:
        for line in page:
            (_, (txt, score)) = line
            # you can filter by score if needed, e.g. if score > 0.5
            lines.append(txt)
    return "\n".join(lines)


def run_ocr(image: Image.Image, engine: OcrEngineName = "paddle", lang: str = "eng") -> str:
    """
    Main entry: choose OCR engine.
    Default = paddle (better handwriting). Fallback to tesseract on failure.
    """
    if engine == "tesseract":
        return tesseract_ocr(image, lang=lang)

    # engine == "paddle"
    try:
        return paddle_ocr(image)
    except Exception as e:
        # fallback if PaddleOCR fails
        print(f"[WARN] PaddleOCR failed ({e}), falling back to Tesseract.")
        return tesseract_ocr(image, lang=lang)
