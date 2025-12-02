import multer from "multer";
import path from "path";
import fs from "fs";

// Store uploads under a directory relative to this file so paths are deterministic
const uploadsDir = path.join(__dirname, "shared", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_, file, cb) => {
    const safeName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, safeName);
  }
});

export default multer({ storage });
