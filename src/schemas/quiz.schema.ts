import { z } from "zod";

export const submitQuizAnswerSchema = z.object({
    selectedOptionIndex: z.number().int().min(0).max(3),
    // Self-assessed or auto-calculated quality: 0 (blackout) to 5 (perfect recall)
    qualityScore: z.number().int().min(0).max(5).default(4),
});

export type SubmitQuizAnswerInput = z.infer<typeof submitQuizAnswerSchema>;