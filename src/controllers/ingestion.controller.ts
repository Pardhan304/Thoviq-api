import { Request, Response } from "express";
import {
    generateUploadUrl,
    ingestUrl,
    ingestMediaAsset,
    listWorkspaceAssets,
} from "../services/ingestion.service.js";
import {
    presignAssetSchema,
    ingestUrlSchema,
    ingestMediaSchema,
} from "../schemas/ingestion.schema.js";
import { getErrorMessage } from "../lib/errors.js";

export async function handlePresignAsset(req: Request, res: Response): Promise<void> {
    try {
        const workspaceId = req.workspaceContext!.workspaceId;
        const userId = req.user!.id;
        const input = presignAssetSchema.parse(req.body);

        const result = await generateUploadUrl(workspaceId, userId, input);
        res.status(200).json({ success: true, ...result });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleIngestUrl(req: Request, res: Response): Promise<void> {
    try {
        const workspaceId = req.workspaceContext!.workspaceId;
        const userId = req.user!.id;
        const input = ingestUrlSchema.parse(req.body);

        const asset = await ingestUrl(workspaceId, userId, input);
        res.status(201).json({ success: true, asset });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleIngestMedia(req: Request, res: Response): Promise<void> {
    try {
        const workspaceId = req.workspaceContext!.workspaceId;
        const userId = req.user!.id;
        const input = ingestMediaSchema.parse(req.body);

        const asset = await ingestMediaAsset(workspaceId, userId, input);
        res.status(201).json({ success: true, asset });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleListAssets(req: Request, res: Response): Promise<void> {
    try {
        const workspaceId = req.workspaceContext!.workspaceId;
        const assets = await listWorkspaceAssets(workspaceId);
        res.status(200).json({ success: true, assets });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}