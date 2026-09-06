import { prisma } from "../lib/prisma.js";
import { CreateProjectInput, UpdateProjectInput } from "../schemas/project.schema.js";

export async function listProjects(workspaceId: string, userId: string) {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { type: true },
    });

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    // In a PERSONAL workspace, show only the user's projects.
    // In a TEAM workspace, show all projects scoped to the team.
    return prisma.project.findMany({
        where: {
            workspaceId,
            isArchived: false,
            ...(workspace.type === "PERSONAL" ? { ownerId: userId } : {}),
        },
        include: {
            _count: {
                select: { tasks: true, knowledgeItems: true, assets: true },
            },
            originKnowledge: {
                select: { id: true, title: true, category: true },
            },
        },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getProjectById(projectId: string, workspaceId: string) {
    const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId },
        include: {
            _count: {
                select: { tasks: true, knowledgeItems: true, assets: true },
            },
            originKnowledge: true,
        },
    });

    if (!project) {
        throw new Error("Project not found in this workspace");
    }

    return project;
}

export async function createProject(
    workspaceId: string,
    userId: string,
    input: CreateProjectInput
) {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { type: true },
    });

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    return prisma.project.create({
        data: {
            workspaceId,
            ownerId: userId,
            title: input.title,
            description: input.description,
            colorCode: input.colorCode,
            visibility: workspace.type === "PERSONAL" ? "PERSONAL" : "TEAM",
            originKnowledgeId: input.originKnowledgeId,
        },
        include: {
            originKnowledge: {
                select: { id: true, title: true },
            },
        },
    });
}

export async function updateProject(
    projectId: string,
    workspaceId: string,
    input: UpdateProjectInput
) {
    const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    return prisma.project.update({
        where: { id: projectId },
        data: input,
    });
}

export async function migrateProject(
    projectId: string,
    sourceWorkspaceId: string,
    targetWorkspaceId: string,
    userId: string
) {
    const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId: sourceWorkspaceId },
    });

    if (!project) {
        throw new Error("Project not found in current workspace");
    }

    if (project.ownerId !== userId) {
        throw new Error("Only the project owner can migrate this project");
    }

    const targetMembership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId: targetWorkspaceId,
                userId,
            },
        },
        include: { workspace: true },
    });

    if (!targetMembership) {
        throw new Error("You are not a member of the destination workspace");
    }

    const targetWorkspace = targetMembership.workspace;

    return prisma.$transaction(async (tx) => {
        // If moving from TEAM to PERSONAL, unassign tasks assigned to other team members
        if (targetWorkspace.type === "PERSONAL") {
            await tx.task.updateMany({
                where: {
                    projectId,
                    assigneeId: { not: userId },
                },
                data: { assigneeId: null },
            });
        }

        // Re-scope the project and its attached knowledge records
        const updatedProject = await tx.project.update({
            where: { id: projectId },
            data: {
                workspaceId: targetWorkspaceId,
                visibility: targetWorkspace.type === "PERSONAL" ? "PERSONAL" : "TEAM",
            },
        });

        await tx.knowledgeItem.updateMany({
            where: { projectId },
            data: { workspaceId: targetWorkspaceId },
        });

        await tx.knowledgeAsset.updateMany({
            where: { projectId },
            data: { workspaceId: targetWorkspaceId },
        });

        return updatedProject;
    });
}

export const projectService = {
    listProjects,
    getProjectById,
    createProject,
    updateProject,
    migrateProject,
};

// Backward-compatible alias
export const ProjectService = projectService;