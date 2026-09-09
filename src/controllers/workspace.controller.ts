import { Request, Response } from "express";
import {
    getUserWorkspaces,
    createTeamWorkspace,
    addWorkspaceMember,
} from "../services/workspace.service.js";
import {
    createWorkspaceSchema,
    addMemberSchema,
} from "../schemas/workspace.schema.js";
import { getErrorMessage } from "../lib/errors.js";

export async function handleListWorkspaces(req: Request, res: Response): Promise<void> {
    try {
        const workspaces = await getUserWorkspaces(req.user!.id);
        res.status(200).json({ success: true, workspaces });
    } catch (err: unknown) {
        res.status(500).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleCreateWorkspace(req: Request, res: Response): Promise<void> {
    try {
        const { name, slug } = createWorkspaceSchema.parse(req.body);
        const workspace = await createTeamWorkspace(req.user!.id, name, slug);
        res.status(201).json({ success: true, workspace });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function handleAddWorkspaceMember(req: Request, res: Response): Promise<void> {
    try {
        const { email, role } = addMemberSchema.parse(req.body);
        const member = await addWorkspaceMember(
            req.workspaceContext!.workspaceId,
            email,
            role
        );
        res.status(201).json({ success: true, member });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}