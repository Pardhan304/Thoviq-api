import { z } from "zod";

export const createWorkspaceSchema = z.object({
    name: z.string().min(2, "Workspace name must be at least 2 characters").max(100),
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const addMemberSchema = z.object({
    email: z.string().email("Valid email is required"),
    role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
