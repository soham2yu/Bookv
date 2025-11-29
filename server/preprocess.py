import cv2
import numpy as np

def preprocess_image(image_bytes):
    npimg = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # remove horizontal notebook lines
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 1))
    remove = cv2.morphologyEx(blur, cv2.MORPH_OPEN, kernel)
    cleaned = cv2.subtract(blur, remove)

    thresh = cv2.adaptiveThreshold(
        cleaned, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY_INV, 21, 15
    )

    return gray, thresh
