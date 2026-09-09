import { prisma } from "../lib/prisma.js";
import { SubmitQuizAnswerInput } from "../schemas/quiz.schema.js";

export function calculateSM2(
    quality: number,
    repetitionCount: number,
    previousInterval: number,
    previousEF: number = 2.5
) {
    // Calculate new Easiness Factor
    let nextEF =
        previousEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (nextEF < 1.3) nextEF = 1.3;

    let nextInterval: number;
    let nextRepetitions: number;

    if (quality < 3) {
        // Failed recall: reset repetitions to start over
        nextRepetitions = 0;
        nextInterval = 1;
    } else {
        // Successful recall: advance spaced schedule
        if (repetitionCount === 0) {
            nextInterval = 1;
        } else if (repetitionCount === 1) {
            nextInterval = 6;
        } else {
            nextInterval = Math.round(previousInterval * nextEF);
        }
        nextRepetitions = repetitionCount + 1;
    }

    return {
        nextInterval,
        nextRepetitions,
        nextEF,
    };
}

export async function getDueQuizzes(workspaceId: string) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return prisma.quiz.findMany({
        where: {
            workspaceId,
            dueDate: { lte: today },
        },
        include: {
            knowledgeItem: {
                select: {
                    id: true,
                    title: true,
                    technology: true,
                    category: true,
                },
            },
        },
        orderBy: { dueDate: "asc" },
    });
}

export async function submitQuizAnswer(
    quizId: string,
    workspaceId: string,
    input: SubmitQuizAnswerInput
) {
    const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, workspaceId },
    });

    if (!quiz) {
        throw new Error("Quiz item not found in this workspace");
    }

    const isCorrect = input.selectedOptionIndex === quiz.correctAnswerIndex;
    // If incorrect and user submitted a high score, downscale quality score
    const effectiveQuality = !isCorrect ? Math.min(input.qualityScore, 2) : input.qualityScore;

    const { nextInterval, nextRepetitions } = calculateSM2(
        effectiveQuality,
        quiz.repetitionCount,
        quiz.intervalDays
    );

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + nextInterval);

    const updatedQuiz = await prisma.quiz.update({
        where: { id: quizId },
        data: {
            repetitionCount: nextRepetitions,
            intervalDays: nextInterval,
            dueDate: nextDueDate,
        },
    });

    return {
        isCorrect,
        correctAnswerIndex: quiz.correctAnswerIndex,
        explanation: quiz.explanation,
        nextReviewInDays: nextInterval,
        nextDueDate,
        quiz: updatedQuiz,
    };
}