import path from "path";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response } from "express";

export const processVideoHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const videoPath = req.file.path;
    console.log("Uploaded file:", videoPath);

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, "shared", "output", jobId);

    const scriptPath = path.join(
      __dirname,
      "..",
      "..",
      "script",
      "ocr_pdf_pipeline.py"
    );

    const py = spawn("python", [
      scriptPath,
      "--video",
      videoPath,
      "--output-dir",
      outputDir,
    ]);

    let stderr = "";
    let stdout = "";

    py.stdout.on("data", (data) => (stdout += data.toString()));
    py.stderr.on("data", (data) => console.error("PY ERROR:", data.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "OCR pipeline failed", details: stderr });
      }

      return res.json({
        success: true,
        jobId,
        originalPdf: `${jobId}/original.pdf`,
        digitalPdf: `${jobId}/digital.pdf`,
      });
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};
