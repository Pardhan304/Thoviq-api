import { Router } from "express";
import {
    handleListTasks,
    handleCreateTask,
    handleUpdateTask,
    handleReorderTask,
    handleGetDailyDocket,
    handleClaimDocketSlot,
    handleToggleDocket,
} from "../controllers/task.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireWorkspace } from "../middlewares/workspaceContext.js";

const router = Router();

router.use(authenticate);

// Docket Routes (Scoped to individual user)
router.get("/docket", handleGetDailyDocket);
router.post("/docket/claim", handleClaimDocketSlot);
router.patch("/docket/:docketId/toggle", handleToggleDocket);

// Kanban Task Board Routes (Workspace Scoped)
router.get("/project/:projectId", requireWorkspace("MEMBER"), handleListTasks);
router.post("/", requireWorkspace("MEMBER"), handleCreateTask);
router.patch("/:taskId", requireWorkspace("MEMBER"), handleUpdateTask);
router.patch("/:taskId/reorder", requireWorkspace("MEMBER"), handleReorderTask);

export default router;