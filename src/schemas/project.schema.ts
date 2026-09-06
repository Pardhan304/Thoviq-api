import { z } from "zod";

export const createProjectSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters").max(200),
    description: z.string().max(2000).optional(),
    colorCode: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color code")
        .default("#3B82F6"),
    originKnowledgeId: z.string().uuid("Invalid origin knowledge UUID").optional(),
});

export const updateProjectSchema = z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(2000).optional(),
    colorCode: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color code")
        .optional(),
    isArchived: z.boolean().optional(),
});

export const migrateProjectSchema = z.object({
    targetWorkspaceId: z.string().uuid("Invalid target workspace ID"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type MigrateProjectInput = z.infer<typeof migrateProjectSchema>;