import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { createPresignedUploadUrl } from "../lib/storage.js";
import { scrapeUrlContent } from "../lib/scraper.js";
import {
    PresignAssetInput,
    IngestUrlInput,
    IngestMediaInput,
} from "../schemas/ingestion.schema.js";

export async function generateUploadUrl(
    workspaceId: string,
    userId: string,
    input: PresignAssetInput
) {
    const extension = input.filename.split(".").pop() || "png";
    const fileKey = `${workspaceId}/${userId}/${crypto.randomUUID()}.${extension}`;

    const { signedUrl, path } = await createPresignedUploadUrl(fileKey);

    return {
        uploadUrl: signedUrl,
        storagePath: path,
    };
}

export async function ingestUrl(
    workspaceId: string,
    userId: string,
    input: IngestUrlInput
) {
    const scraped = await scrapeUrlContent(input.url);

    return prisma.knowledgeAsset.create({
        data: {
            workspaceId,
            projectId: input.projectId,
            creatorId: userId,
            type: "LINK",
            bucket: "LINKS",
            title: scraped.title,
            sourceUrl: input.url,
            thumbnailUrl: scraped.thumbnailUrl,
            authorName: scraped.authorName,
            rawContent: scraped.cleanText,
            metadata: {
                description: scraped.description,
                tags: input.tags,
            },
        },
    });
}

export async function ingestMediaAsset(
    workspaceId: string,
    userId: string,
    input: IngestMediaInput
) {
    return prisma.knowledgeAsset.create({
        data: {
            workspaceId,
            projectId: input.projectId,
            creatorId: userId,
            type: "SCREENSHOT",
            bucket: "SCREENSHOTS",
            title: input.title,
            storagePath: input.storagePath,
            metadata: {
                mimeType: input.mimeType,
                tags: input.tags,
            },
        },
    });
}

export async function listWorkspaceAssets(workspaceId: string) {
    return prisma.knowledgeAsset.findMany({
        where: { workspaceId },
        include: {
            creator: {
                select: { id: true, fullName: true, avatarUrl: true },
            },
            knowledgeItem: {
                select: { id: true, title: true, category: true },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
}