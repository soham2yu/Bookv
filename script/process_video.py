# script/process_video.py
import os
import sys
import json
from pathlib import Path
from typing import Any, Dict

from video_to_frames import extract_frames
from ocr_pdf_pipeline import ocr_frames_to_pdfs


def main() -> None:
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: process_video.py <video_path> <output_dir>"}))
        sys.exit(1)

    video_path = sys.argv[1]
    output_dir = sys.argv[2]

    try:
        video_path = str(Path(video_path).resolve())
        output_dir = str(Path(output_dir).resolve())
        os.makedirs(output_dir, exist_ok=True)

        frames_dir = os.path.join(output_dir, "frames")
        os.makedirs(frames_dir, exist_ok=True)

        frame_paths = extract_frames(video_path, frames_dir, target_fps=1.0)

        original_pdf, digital_pdf = ocr_frames_to_pdfs(
            frame_paths,
            output_dir,
            lang="eng",  # extend if you want multi-lang
        )

        result: Dict[str, Any] = {
            "success": True,
            "original_pdf": original_pdf,
            "digital_pdf": digital_pdf,
        }
        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        err = {"success": False, "error": str(e)}
        print(json.dumps(err))
        sys.exit(1)


if __name__ == "__main__":
    main()
