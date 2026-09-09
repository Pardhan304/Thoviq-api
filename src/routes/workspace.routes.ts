import { Router } from "express";
import {
    handleListWorkspaces,
    handleCreateWorkspace,
    handleAddWorkspaceMember,
} from "../controllers/workspace.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireWorkspace } from "../middlewares/workspaceContext.js";

const router = Router();

// All workspace routes require an authenticated user session
router.use(authenticate);

// List all workspaces the user belongs to (Personal + Teams)
router.get("/", handleListWorkspaces);

// Create a new collaborative Team Workspace
router.post("/", handleCreateWorkspace);

// Add a member to a workspace (Requires ADMIN or OWNER role)
router.post(
    "/:workspaceId/members",
    requireWorkspace("ADMIN"),
    handleAddWorkspaceMember
);

export default router;