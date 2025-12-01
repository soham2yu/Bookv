import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "uploads");
const OUTPUT_DIR = path.join(__dirname, "output");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// File storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/scan", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const inputPath = req.file.path;
    const jobId = path.basename(inputPath, path.extname(inputPath));
    const jobOutputDir = path.join(OUTPUT_DIR, jobId);

    if (!fs.existsSync(jobOutputDir)) fs.mkdirSync(jobOutputDir, { recursive: true });

    const pythonCmd = process.env.PYTHON_CMD || "python";
    const scriptPath = path.join(__dirname, "..", "..", "script", "ocr_pdf_pipeline.py");

    const args = [
      scriptPath,
      "--input",
      inputPath,
      "--output-dir",
      jobOutputDir,
    ];

    console.log("\n[SERVER] Running OCR:", pythonCmd, args.join(" "));

    const child = spawn(pythonCmd, args, { shell: false });

    child.stdout.on("data", (data) => console.log("[OCR]", data.toString()));
    child.stderr.on("data", (data) => console.log("[OCR_ERR]", data.toString()));

    child.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "OCR process failed", exitCode: code });
      }

      res.json({
        ok: true,
        jobId,
        originalPdfUrl: `/files/${jobId}/original.pdf`,
        digitalPdfUrl: `/files/${jobId}/digital.pdf`,
      });
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

export default router;
