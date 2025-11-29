import express, { Request, Response } from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import runProcessVideo from "./runPython";

const app = express();

// Folders
const uploadsDir = path.join(__dirname, "../../uploads");
const outputsDir = path.join(__dirname, "../../outputs");

[uploadsDir, outputsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use("/static", express.static(outputsDir));

// Multer config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

// ---- PROCESS ROUTE ----
app.post("/process-video", upload.single("video"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No video uploaded" });

  const jobId = req.file.filename.split(".")[0];
  const outputDir = path.join(outputsDir, jobId);

  try {
    const result = await runProcessVideo(req.file.path, outputDir);

    res.json({
      success: true,
      original_pdf: `/static/${jobId}/original.pdf`,
      digital_pdf: `/static/${jobId}/digital.pdf`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});

// Start server
app.listen(5000, () => console.log("🚀 Server running: http://localhost:5000"));
