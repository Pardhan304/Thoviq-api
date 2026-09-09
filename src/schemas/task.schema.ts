import { z } from "zod";

export const createTaskSchema = z.object({
    projectId: z.string().uuid("Valid project ID is required"),
    title: z.string().min(2, "Title must be at least 2 characters").max(255),
    description: z.string().max(5000).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    weight: z.union([z.literal(1), z.literal(3), z.literal(5)]).default(1),
    assigneeId: z.string().uuid().optional(),
    dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(2).max(255).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    weight: z.union([z.literal(1), z.literal(3), z.literal(5)]).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
});

export const reorderTaskSchema = z.object({
    status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
    prevOrderIndex: z.number().nullable().optional(),
    nextOrderIndex: z.number().nullable().optional(),
});

export const claimDocketSchema = z.object({
    taskId: z.string().uuid("Valid task ID is required"),
    tier: z.enum(["PRIMARY", "MOMENTUM"]),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Target date must be YYYY-MM-DD format"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>;
export type ClaimDocketInput = z.infer<typeof claimDocketSchema>;