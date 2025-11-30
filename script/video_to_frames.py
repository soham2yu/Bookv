"""
video_to_frames.py

Extracts clean high-resolution frames for OCR from video.
Removes blurry frames and normalizes resolution.
"""

import os
import cv2
from typing import List
import numpy as np


def is_blurry(image, threshold=120.0) -> bool:
    """
    Detect if frame is blurry using Laplacian sharpness metric.
    Returns True if blurry.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    fm = cv2.Laplacian(gray, cv2.CV_64F).var()
    return fm < threshold


def extract_frames(
    video_path: str,
    output_dir: str,
    target_fps: float = 1.0,
) -> List[str]:

    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"❌ Failed to open video: {video_path}")

    video_fps = cap.get(cv2.CAP_PROP_FPS)
    if not video_fps or video_fps <= 0:
        video_fps = 25.0

    step = max(int(round(video_fps / target_fps)), 1)

    # Force high resolution output
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    frame_idx = 0
    saved_idx = 0
    frame_paths: List[str] = []

    while True:
        success, frame = cap.read()
        if not success:
            break

        if frame_idx % step == 0:
            # Skip blurry frames
            if is_blurry(frame, threshold=160.0):
                frame_idx += 1
                continue

            # Resize to 1920x1080 if needed
            frame = cv2.resize(frame, (1920, 1080))

            frame_name = f"frame_{saved_idx:04d}.png"
            frame_path = os.path.join(output_dir, frame_name)

            cv2.imwrite(frame_path, frame, [cv2.IMWRITE_PNG_COMPRESSION, 0])

            frame_paths.append(os.path.abspath(frame_path))
            saved_idx += 1

        frame_idx += 1

    cap.release()
    return frame_paths


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: python video_to_frames.py <video_path> <output_dir>")
        sys.exit(1)

    frames = extract_frames(sys.argv[1], sys.argv[2])
    print(f" Extracted {len(frames)} valid frames.")
