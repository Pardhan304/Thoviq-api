import { Router } from "express";
import {
    handlePresignAsset,
    handleIngestUrl,
    handleIngestMedia,
    handleListAssets,
} from "../controllers/ingestion.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireWorkspace } from "../middlewares/workspaceContext.js";

const router = Router();

router.use(authenticate);

// List recently ingested assets in the workspace
router.get("/", requireWorkspace("MEMBER"), handleListAssets);

// Generate pre-signed S3 upload URL for screenshots/media
router.post("/presign", requireWorkspace("MEMBER"), handlePresignAsset);

// Ingest and scrape a web / Instagram / YouTube URL
router.post("/url", requireWorkspace("MEMBER"), handleIngestUrl);

// Record finalized media upload
router.post("/media", requireWorkspace("MEMBER"), handleIngestMedia);

export default router;