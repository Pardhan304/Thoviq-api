import { Router } from "express";
import {
    handleGetDueQuizzes,
    handleSubmitQuiz,
} from "../controllers/quiz.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireWorkspace } from "../middlewares/workspaceContext.js";

const router = Router();

router.use(authenticate);

// Fetch all active recall quizzes due for review in this workspace
router.get("/due", requireWorkspace("MEMBER"), handleGetDueQuizzes);

// Submit an answer to calculate next interval via SM-2
router.post("/:quizId/submit", requireWorkspace("MEMBER"), handleSubmitQuiz);

export default router;