import { Router } from "express";
import {
    handleProcessAsset,
    handleListKnowledge,
    handleGetKnowledgeDetails,
    handleConvertToProject,
} from "../controllers/crystallization.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireWorkspace } from "../middlewares/workspaceContext.js";

const router = Router();

router.use(authenticate);

// List all categorized knowledge cards in the workspace
router.get("/", requireWorkspace("MEMBER"), handleListKnowledge);

// Get single concept card with all attached sources and quizzes
router.get("/:id", requireWorkspace("MEMBER"), handleGetKnowledgeDetails);

// Process a captured raw asset with Gemini Flash
router.post("/process/:assetId", requireWorkspace("MEMBER"), handleProcessAsset);

// Convert a Concept Card into a full Project Roadmap
router.post("/:id/convert-to-project", requireWorkspace("MEMBER"), handleConvertToProject);

export default router;