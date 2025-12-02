## OCR PDF Pipeline — Local Testing

This document describes quick steps to test the OCR pipeline locally (without starting the Node server).

Prerequisites
- Windows PowerShell (this project was developed on Windows)
- Python 3.10+ installed and available on PATH
- Tesseract OCR installed (https://github.com/tesseract-ocr/tesseract)

Quick test (PowerShell)

1. Open PowerShell in the repository root.

2. Run the helper script with your sample video path:

```powershell
cd .\script
.\run_local_test.ps1 -VideoPath 'C:\path\to\your_video.mp4' -OutDir '..\server\controllers\shared\output\test_run'
```

What the script does
- Creates a virtual environment at `script/.venv` (if missing).
- Installs Python dependencies from `script/requirements.txt`.
- Runs `process_video.py` which extracts frames, filters, runs OCR and writes `original.pdf` and `digital.pdf` in the specified `OutDir`.

If you see errors
- Check the PowerShell output for Python tracebacks.
- Common issues: missing Tesseract (set `pytesseract.pytesseract.tesseract_cmd`), missing Python packages, OpenCV failing to read video.

Next steps
- If this test succeeds, try the full flow via the Node server or the client UI.
- If it fails, copy the full PowerShell output and paste it in an issue or here so I can help debug further.
