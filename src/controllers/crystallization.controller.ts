import { Request, Response } from "express";
import {
    processAndCrystallizeAsset,
    listKnowledgeItems,
    getKnowledgeItemDetails,
    convertKnowledgeToProject,
} from "../services/crystallization.service.js";
import { getErrorMessage } from "../lib/errors.js";

export async function handleProcessAsset(req: Request, res: Response): Promise<void> {
    try {
        const assetId = req.params.assetId as string;
        const workspaceId = req.workspaceContext!.workspaceId;

        const result = await processAndCrystallizeAsset(assetId, workspaceId);
        res.status(200).json({ success: true, ...result });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleListKnowledge(req: Request, res: Response): Promise<void> {
    try {
        const workspaceId = req.workspaceContext!.workspaceId;
        const category = req.query.category as string | undefined;

        const items = await listKnowledgeItems(workspaceId, category);
        res.status(200).json({ success: true, items });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleGetKnowledgeDetails(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const workspaceId = req.workspaceContext!.workspaceId;

        const item = await getKnowledgeItemDetails(id, workspaceId);
        res.status(200).json({ success: true, item });
    } catch (err: unknown) {
        res.status(404).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleConvertToProject(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const workspaceId = req.workspaceContext!.workspaceId;
        const userId = req.user!.id;

        const project = await convertKnowledgeToProject(id, workspaceId, userId);
        res.status(201).json({
            success: true,
            message: "Concept successfully converted into an active project roadmap",
            project,
        });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}