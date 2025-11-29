from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from preprocess import preprocess_image
from ocr_htr import run_htr
from segment import segment_lines
import cv2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/htr")
async def htr(file: UploadFile = File(...)):
    img_bytes = await file.read()

    print("\n================ OCR REQUEST RECEIVED ================")
    print("Filename:", file.filename)

    processed, threshold = preprocess_image(img_bytes)
    lines = segment_lines(threshold)

    print("Detected Lines:", len(lines))

    results = []
    for (y1, y2) in lines:
        print("Segment:", y1, y2)
        crop = processed[y1:y2, :]
        _, enc = cv2.imencode(".png", crop)
        text = run_htr(enc.tobytes())
        results.append(text)

    response = "\n".join(results)
    print("\nOCR RESULT:\n", response)
    print("======================================================")

    return {"text": response}
