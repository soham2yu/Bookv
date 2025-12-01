import { Request, Response } from "express";
import path from "path";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";

export const processVideoHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const videoPath = req.file.path;
    const jobId = uuidv4();
    const outputDir = path.join("server", "shared", "output", jobId);
    const scriptPath = path.join(__dirname, "..", "..", "script", "ocr_pdf_pipeline.py");

const py = spawn("python", [scriptPath, "--video", videoPath, "--output-dir", outputDir]);


    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => (stdout += data.toString()));
    py.stderr.on("data", (data) => console.error("PY ERROR:", data.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "OCR pipeline failed", details: stderr });
      }

return res.json({
  success: true,
  jobId,
  originalPdf: `http://localhost:5000/static/output/${jobId}/original.pdf`,
  digitalPdf: `http://localhost:5000/static/output/${jobId}/digital.pdf`
});

    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
