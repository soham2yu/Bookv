import { Router } from "express";
import multer from "multer";
import { processVideoHandler } from "./controllers/videoController";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/api/process-video", upload.single("video"), processVideoHandler);

export default router;
