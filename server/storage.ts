import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: path.join("server", "shared", "uploads"),
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

export default multer({ storage });
