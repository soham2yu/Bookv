import numpy as np
import cv2
from paddleocr import PaddleOCR

# Load model once (not inside function!)
ocr = PaddleOCR(use_angle_cls=True, lang="en")

def run_htr(image_bytes):
    npimg = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    result = ocr.ocr(img, cls=True)

    text_lines = []
    for line in result:
        if line and len(line) > 0:
            text_lines.append(line[1][0])  # Extract text only

    return "\n".join(text_lines)
