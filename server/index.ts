import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Where uploads + outputs go (relative to repo root when running from /server)
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const OUTPUT_DIR = path.join(__dirname, "..", "outputs");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// serve generated pdfs statically
app.use("/files", express.static(OUTPUT_DIR));

/**
 * POST /api/scan
 * form-data:
 *   file: video/image
 */
app.post("/api/scan", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const inputPath = req.file.path;
    const jobId = path.basename(inputPath, path.extname(inputPath));
    const jobOutputDir = path.join(OUTPUT_DIR, jobId);

    if (!fs.existsSync(jobOutputDir)) fs.mkdirSync(jobOutputDir, { recursive: true });

    // Path to python + pipeline script
    const pythonCmd = process.env.PYTHON_CMD || "python";
    const scriptPath = path.join(__dirname, "..", "script", "ocr_pdf_pipeline.py");

    const args = [
      scriptPath,
      "--input",
      inputPath,
      "--output-dir",
      jobOutputDir,
    ];

    if (process.env.TESSERACT_CMD) {
      args.push("--tesseract-cmd", process.env.TESSERACT_CMD);
    }

    console.log("[SERVER] Spawning OCR:", pythonCmd, args.join(" "));

    const child = spawn(pythonCmd, args, { shell: false });

    child.stdout.on("data", (data) => {
      console.log("[OCR]", data.toString());
    });

    child.stderr.on("data", (data) => {
      console.error("[OCR-ERR]", data.toString());
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error("[OCR] exited with code", code);
        return res.status(500).json({ error: "OCR pipeline failed", code });
      }

      const originalPath = path.join(jobOutputDir, "original.pdf");
      const digitalPath = path.join(jobOutputDir, "digital.pdf");

      if (!fs.existsSync(originalPath) || !fs.existsSync(digitalPath)) {
        return res.status(500).json({
          error: "PDFs not generated",
        });
      }

      // URLs for frontend
      const base = `/files/${jobId}`;
      return res.json({
        jobId,
        originalPdfUrl: `${base}/original.pdf`,
        digitalPdfUrl: `${base}/digital.pdf`,
      });
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err?.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BookVision server running on port ${PORT}`);
});
