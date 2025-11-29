# script/video_to_frames.py
import os
import cv2
from typing import List

def extract_frames(video_path: str, output_dir: str, target_fps: float = 1.0) -> List[str]:
    """
    Extract frames from video at approx target_fps (frames per second).
    Returns list of frame file paths in order.
    """
    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    orig_fps = cap.get(cv2.CAP_PROP_FPS)
    if orig_fps <= 0:
        orig_fps = 25.0  # fallback

    frame_interval = max(int(orig_fps // target_fps), 1)

    frame_paths = []
    frame_idx = 0
    saved_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_interval == 0:
            # basic preprocessing to help OCR
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # normalize contrast
            gray = cv2.equalizeHist(gray)
            # optional: resize to improve text clarity
            height, width = gray.shape
            if max(height, width) < 1000:
                scale = 1000 / max(height, width)
                gray = cv2.resize(
                    gray,
                    (int(width * scale), int(height * scale)),
                    interpolation=cv2.INTER_CUBIC,
                )

            frame_name = f"frame_{saved_idx:04d}.png"
            frame_path = os.path.join(output_dir, frame_name)
            cv2.imwrite(frame_path, gray)
            frame_paths.append(frame_path)
            saved_idx += 1

        frame_idx += 1

    cap.release()

    if not frame_paths:
        raise RuntimeError("No frames extracted. Check video file and codecs.")

    return frame_paths
