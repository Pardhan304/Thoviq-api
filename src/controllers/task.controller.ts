import { Request, Response } from "express";
import {
    listProjectTasks,
    createTask,
    updateTask,
    reorderTask,
    getDailyDocket,
    claimDocketSlot,
    toggleDocketCompletion,
} from "../services/task.service.js";
import {
    createTaskSchema,
    updateTaskSchema,
    reorderTaskSchema,
    claimDocketSchema,
} from "../schemas/task.schema.js";
import { getErrorMessage } from "../lib/errors.js";

export async function handleListTasks(req: Request, res: Response): Promise<void> {
    try {
        const projectId = req.params.projectId as string;
        const workspaceId = req.workspaceContext!.workspaceId;

        const tasks = await listProjectTasks(projectId, workspaceId);
        res.status(200).json({ success: true, tasks });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleCreateTask(req: Request, res: Response): Promise<void> {
    try {
        const workspaceId = req.workspaceContext!.workspaceId;
        const userId = req.user!.id;
        const input = createTaskSchema.parse(req.body);

        const task = await createTask(workspaceId, userId, input);
        res.status(201).json({ success: true, task });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleUpdateTask(req: Request, res: Response): Promise<void> {
    try {
        const taskId = req.params.taskId as string;
        const workspaceId = req.workspaceContext!.workspaceId;
        const input = updateTaskSchema.parse(req.body);

        const task = await updateTask(taskId, workspaceId, input);
        res.status(200).json({ success: true, task });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleReorderTask(req: Request, res: Response): Promise<void> {
    try {
        const taskId = req.params.taskId as string;
        const workspaceId = req.workspaceContext!.workspaceId;
        const input = reorderTaskSchema.parse(req.body);

        const task = await reorderTask(taskId, workspaceId, input);
        res.status(200).json({ success: true, task });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleGetDailyDocket(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.user!.id;
        const dateStr = (req.query.date as string) || new Date().toISOString().split("T")[0];

        const dockets = await getDailyDocket(userId, dateStr);
        res.status(200).json({ success: true, dockets });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleClaimDocketSlot(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.user!.id;
        const input = claimDocketSchema.parse(req.body);

        const docket = await claimDocketSlot(userId, input);
        res.status(201).json({ success: true, docket });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleToggleDocket(req: Request, res: Response): Promise<void> {
    try {
        const docketId = req.params.docketId as string;
        const userId = req.user!.id;

        const docket = await toggleDocketCompletion(docketId, userId);
        res.status(200).json({ success: true, docket });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}