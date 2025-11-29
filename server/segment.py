import cv2
import numpy as np

def segment_lines(thresh):
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 5))
    dilated = cv2.dilate(thresh, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    lines = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if h > 25:  # ignore notebook lines
            lines.append((y, y + h))

    lines = sorted(lines, key=lambda x: x[0])
    return lines
