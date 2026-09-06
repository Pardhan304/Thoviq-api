import { Router } from "express";
import {
    list,
    getById,
    create,
    update,
    migrate,
} from "../controllers/project.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireWorkspace } from "../middlewares/workspaceContext.js";

const router = Router();

router.use(authenticate);

// List all projects in active workspace (requires MEMBER role or above)
router.get("/", requireWorkspace("MEMBER"), list);

// Create a new project inside the active workspace
router.post("/", requireWorkspace("MEMBER"), create);

// Fetch single project details
router.get("/:projectId", requireWorkspace("MEMBER"), getById);

// Update project metadata
router.patch("/:projectId", requireWorkspace("MEMBER"), update);

// Bidirectional migration (Personal <-> Team)
router.patch("/:projectId/migrate", requireWorkspace("MEMBER"), migrate);

export default router;