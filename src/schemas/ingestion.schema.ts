import { z } from "zod";

export const presignAssetSchema = z.object({
    filename: z.string().min(1, "Filename is required"),
    mimeType: z.enum([
        "image/png",
        "image/jpeg",
        "image/webp",
        "application/pdf",
    ]),
});

export const ingestUrlSchema = z.object({
    url: z.string().url("Valid URL is required"),
    projectId: z.string().uuid("Invalid project ID").optional(),
    tags: z.array(z.string()).default([]),
});

export const ingestMediaSchema = z.object({
    storagePath: z.string().min(1, "Storage path is required"),
    title: z.string().min(1, "Title is required"),
    mimeType: z.string(),
    projectId: z.string().uuid("Invalid project ID").optional(),
    tags: z.array(z.string()).default([]),
});

export type PresignAssetInput = z.infer<typeof presignAssetSchema>;
export type IngestUrlInput = z.infer<typeof ingestUrlSchema>;
export type IngestMediaInput = z.infer<typeof ingestMediaSchema>;