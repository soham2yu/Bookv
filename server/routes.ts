import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { runProcessVideo } from "./runPython";

const router = Router();

// Directories for upload and output
const uploadsDir = path.join(__dirname, "../../uploads");
const outputsDir = path.join(__dirname, "../../outputs");

[uploadsDir, outputsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// MAIN ENDPOINT: process video
router.post("/process-video", upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No video uploaded" });

  const jobId = req.file.filename.split(".")[0];
  const jobDir = path.join(outputsDir, jobId);

  const result = await runProcessVideo(req.file.path, jobDir);

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json({
    success: true,
    original_pdf: `/static/${jobId}/original.pdf`,
    digital_pdf: `/static/${jobId}/digital.pdf`,
  });
});

export default router;
