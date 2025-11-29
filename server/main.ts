import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { runProcessVideo } from "./runPython.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Correct root folder structure
const uploadsDir = path.join(__dirname, "../../uploads");
const outputsDir = path.join(__dirname, "../../outputs");

// Make dirs
[uploadsDir, outputsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// static access for PDFs
app.use("/static", express.static(outputsDir));

// Multer video upload configx
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, "").replace(/\s+/g, "_");
    cb(null, `${name}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/"))
      return cb(new Error("Only video allowed"));
    cb(null, true);
  },
});

// Health check
app.get("/api/health", (req, res) => res.json({ status: "OK" }));

// MAIN PROCESS ROUTE
app.post("/api/process-video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No video file uploaded" });

    const jobId = path.basename(req.file.filename, path.extname(req.file.filename));
    const jobDir = path.join(outputsDir, jobId);

    const result = await runProcessVideo(req.file.path, jobDir);

    if (!result.success) return res.status(500).json({ error: result.error });

    res.json({
      success: true,
      original_pdf: `/static/${jobId}/original.pdf`,
      digital_pdf: `/static/${jobId}/digital.pdf`,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
