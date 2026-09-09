import { Request, Response } from "express";
import { getDueQuizzes, submitQuizAnswer } from "../services/quiz.service.js";
import { submitQuizAnswerSchema } from "../schemas/quiz.schema.js";

export async function handleGetDueQuizzes(req: Request, res: Response) {
    try {
        const workspaceId = req.workspaceContext!.workspaceId;
        const quizzes = await getDueQuizzes(workspaceId);
        res.status(200).json({ success: true, count: quizzes.length, quizzes });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function handleSubmitQuiz(req: Request, res: Response) {
    try {
        const quizId = req.params.quizId as string;
        const workspaceId = req.workspaceContext!.workspaceId;
        const input = submitQuizAnswerSchema.parse(req.body);

        const result = await submitQuizAnswer(quizId, workspaceId, input);
        res.status(200).json({ success: true, ...result });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}