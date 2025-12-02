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

    // Prefer project virtualenv python if it exists to avoid system/python mismatches
    const projectVenvPython = path.join(__dirname, "..", "..", "ocrenv", "Scripts", "python.exe");
    const pythonExec = (process.env.PYTHON_PATH && process.env.PYTHON_PATH.length > 0)
      ? process.env.PYTHON_PATH
      : (require('fs').existsSync(projectVenvPython) ? projectVenvPython : "python");

    console.log("Using Python executable:", pythonExec);

    const py = spawn(pythonExec, [
      scriptPath,
      "--video",
      videoPath,
      "--output-dir",
      outputDir,
    ]);

    let stderr = "";
    let stdout = "";

    py.stdout.on("data", (data) => (stdout += data.toString()));
    py.stderr.on("data", (data) => (stderr += data.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        console.error("OCR pipeline failed:", stderr || stdout);
        return res.status(500).json({ error: "OCR pipeline failed", details: stderr || stdout });
      }

      // Try to parse JSON from stdout (script prints JSON on success)
      try {
        const parsed = JSON.parse(stdout.trim());

        // The Python script returns filesystem paths. We expose HTTP URLs under /static/<jobId>/...
        const originalUrl = parsed.original_pdf ? `/static/${jobId}/original.pdf` : `/static/${jobId}/original.pdf`;
        const digitalUrl = parsed.digital_pdf ? `/static/${jobId}/digital.pdf` : `/static/${jobId}/digital.pdf`;

        return res.json({
          success: true,
          jobId,
          // provide both snake_case and camelCase keys for compatibility
          original_pdf: parsed.original_pdf || String(outputDir),
          digital_pdf: parsed.digital_pdf || String(outputDir),
          originalPdf: originalUrl,
          digitalPdf: digitalUrl,
        });
      } catch (e) {
        // Fallback if the script didn't print JSON
        // Fallback: return static URLs using jobId
        return res.json({
          success: true,
          jobId,
          originalPdf: `/static/${jobId}/original.pdf`,
          digitalPdf: `/static/${jobId}/digital.pdf`,
        });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};
