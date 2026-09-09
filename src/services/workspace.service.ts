import { prisma } from "../lib/prisma.js";
import { MemberRole } from "@prisma/client";

export async function getUserWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
            workspace: {
                include: {
                    _count: {
                        select: { members: true, projects: true, knowledgeItems: true },
                    },
                },
            },
        },
        orderBy: {
            workspace: { createdAt: "asc" },
        },
    });

    return memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        type: m.workspace.type,
        role: m.role,
        memberCount: m.workspace._count.members,
        projectCount: m.workspace._count.projects,
        knowledgeItemCount: m.workspace._count.knowledgeItems,
    }));
}

export async function createTeamWorkspace(userId: string, name: string, slug: string) {
    const existing = await prisma.workspace.findUnique({
        where: { slug },
    });

    if (existing) {
        throw new Error("Workspace slug is already taken");
    }

    return prisma.$transaction(async (tx) => {
        const workspace = await tx.workspace.create({
            data: {
                name,
                slug,
                type: "TEAM",
                ownerId: userId,
            },
        });

        await tx.workspaceMember.create({
            data: {
                workspaceId: workspace.id,
                userId,
                role: "OWNER",
            },
        });

        return workspace;
    });
}

export async function addWorkspaceMember(workspaceId: string, email: string, role: MemberRole) {
    const targetUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
        throw new Error("No user found with this email address");
    }

    const existingMember = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId: targetUser.id,
            },
        },
    });

    if (existingMember) {
        throw new Error("User is already a member of this workspace");
    }

    return prisma.workspaceMember.create({
        data: {
            workspaceId,
            userId: targetUser.id,
            role,
        },
        include: {
            user: {
                select: { id: true, email: true, fullName: true, avatarUrl: true },
            },
        },
    });
}