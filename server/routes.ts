import { Router } from "express";
import { processVideoHandler } from "./controllers/videoController";
import upload from "./storage";

const router = Router();

// Apply multer middleware so `req.file` is available in the handler.
router.post("/api/process-video", upload.single("video"), processVideoHandler);

// Debug endpoint: echoes back the uploaded file metadata and any form fields.
router.post("/api/debug-upload", upload.single("video"), (req, res) => {
	try {
		const file = req.file;
		const body = req.body;

		return res.json({ success: true, file, body });
	} catch (e) {
		return res.status(500).json({ success: false, error: String(e) });
	}
});

export default router;
