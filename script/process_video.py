import os
import json
import sys
import cv2

# Ensure the script directory is on sys.path so sibling module imports work
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from ocr_pdf_pipeline import ocr_frames_to_pdfs


def frame_quality_scores(frame, prev_gray=None):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    sharp = cv2.Laplacian(gray, cv2.CV_64F).var()
    bright = gray.mean()
    motion = 0.0
    if prev_gray is not None:
        diff = cv2.absdiff(gray, prev_gray)
        motion = diff.mean()
    return sharp, bright, motion, gray


def is_good_frame(sharp, bright, motion,
                  sharp_thresh=80, bright_min=60, bright_max=200,
                  motion_min=5):
    """
    Keep only frames that are:
      - sharp enough
      - not too dark/bright
      - have some motion change compared to previous (page turn)
    """
    return (
        sharp > sharp_thresh
        and bright_min < bright < bright_max
        and motion > motion_min
    )


def extract_frames(video_path, output_dir, step=5):
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    count = 0
    file_count = 0
    prev_gray = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if count % step == 0:
            sharp, bright, motion, gray = frame_quality_scores(frame, prev_gray)

            if is_good_frame(sharp, bright, motion):
                path = os.path.join(output_dir, f"frame_{file_count:05d}.jpg")
                cv2.imwrite(path, frame)
                file_count += 1

            prev_gray = gray

        count += 1

    cap.release()

    return [
        os.path.join(output_dir, f)
        for f in sorted(os.listdir(output_dir))
        if f.lower().endswith(".jpg")
    ]


def main():
    import sys
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: python process_video.py <video_path> <output_dir>"}))
        return

    video_path, out_dir = sys.argv[1], sys.argv[2]
    frames_dir = os.path.join(out_dir, "frames")

    try:
        print("Extracting frames...")
        frames = extract_frames(video_path, frames_dir, step=5)

        if not frames:
            print(json.dumps({"success": False, "error": "No usable frames extracted"}))
            return

        print("Running OCR and PDF generation...")
        result = ocr_frames_to_pdfs(frames, out_dir)

        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))


if __name__ == "__main__":
    main()
