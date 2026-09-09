import { Request, Response } from "express";
import * as projectService from "../services/project.service.js";
import {
    createProjectSchema,
    updateProjectSchema,
    migrateProjectSchema,
} from "../schemas/project.schema.js";
import { getErrorMessage } from "../lib/errors.js";

export async function list(req: Request, res: Response): Promise<void> {
    try {
        const workspaceId = req.workspaceContext!.workspaceId;
        const userId = req.user!.id;

        const projects = await projectService.listProjects(workspaceId, userId);
        res.status(200).json({ success: true, projects });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function getById(req: Request, res: Response): Promise<void> {
    try {
        const projectId = req.params.projectId as string;
        const workspaceId = req.workspaceContext!.workspaceId;

        const project = await projectService.getProjectById(projectId, workspaceId);
        res.status(200).json({ success: true, project });
    } catch (err: unknown) {
        res.status(404).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function create(req: Request, res: Response): Promise<void> {
    try {
        const workspaceId = req.workspaceContext!.workspaceId;
        const userId = req.user!.id;
        const input = createProjectSchema.parse(req.body);

        const project = await projectService.createProject(workspaceId, userId, input);
        res.status(201).json({ success: true, project });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function update(req: Request, res: Response): Promise<void> {
    try {
        const projectId = req.params.projectId as string;
        const workspaceId = req.workspaceContext!.workspaceId;
        const input = updateProjectSchema.parse(req.body);

        const project = await projectService.updateProject(projectId, workspaceId, input);
        res.status(200).json({ success: true, project });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function migrate(req: Request, res: Response): Promise<void> {
    try {
        const projectId = req.params.projectId as string;
        const sourceWorkspaceId = req.workspaceContext!.workspaceId;
        const userId = req.user!.id;
        const { targetWorkspaceId } = migrateProjectSchema.parse(req.body);

        const project = await projectService.migrateProject(
            projectId,
            sourceWorkspaceId,
            targetWorkspaceId,
            userId
        );

        res.status(200).json({
            success: true,
            message: "Project migrated successfully",
            project,
        });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export const projectController = {
    list,
    getById,
    create,
    update,
    migrate,
};

// Backward-compatible alias
export const ProjectController = projectController;