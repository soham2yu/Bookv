import { Router } from "express";
import { processVideoHandler } from "./controllers/videoController";

const router = Router();

router.post("/api/process-video", processVideoHandler);

export default router;
