import { prisma } from "../lib/prisma.js";
import {
    CreateTaskInput,
    UpdateTaskInput,
    ReorderTaskInput,
    ClaimDocketInput,
} from "../schemas/task.schema.js";

// Calculates O(1) fractional index
export function calculateOrderIndex(
    prevIndex?: number | null,
    nextIndex?: number | null
): number {
    if (prevIndex == null && nextIndex == null) {
        return 1000.0;
    }
    if (prevIndex == null && nextIndex != null) {
        return nextIndex / 2.0;
    }
    if (prevIndex != null && nextIndex == null) {
        return prevIndex + 1000.0;
    }
    return (prevIndex! + nextIndex!) / 2.0;
}

export async function listProjectTasks(projectId: string, workspaceId: string) {
    const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId },
    });

    if (!project) {
        throw new Error("Project not found in this workspace");
    }

    return prisma.task.findMany({
        where: { projectId },
        include: {
            assignee: {
                select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
            checklists: {
                orderBy: { orderIndex: "asc" },
            },
            _count: {
                select: { checklists: true },
            },
        },
        orderBy: { orderIndex: "asc" },
    });
}

export async function createTask(
    workspaceId: string,
    userId: string,
    input: CreateTaskInput
) {
    const project = await prisma.project.findFirst({
        where: { id: input.projectId, workspaceId },
    });

    if (!project) {
        throw new Error("Project not found in this workspace");
    }

    // Find the highest orderIndex in the TODO column to place new task at bottom
    const lastTask = await prisma.task.findFirst({
        where: { projectId: input.projectId, status: "TODO" },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
    });

    const orderIndex = calculateOrderIndex(lastTask?.orderIndex ?? null, null);

    return prisma.task.create({
        data: {
            projectId: input.projectId,
            creatorId: userId,
            assigneeId: input.assigneeId,
            title: input.title,
            description: input.description,
            priority: input.priority,
            weight: input.weight,
            orderIndex,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        include: {
            assignee: {
                select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
        },
    });
}

export async function updateTask(
    taskId: string,
    workspaceId: string,
    input: UpdateTaskInput
) {
    const task = await prisma.task.findFirst({
        where: { id: taskId, project: { workspaceId } },
    });

    if (!task) {
        throw new Error("Task not found in this workspace");
    }

    return prisma.task.update({
        where: { id: taskId },
        data: {
            ...input,
            dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
        },
    });
}

export async function reorderTask(
    taskId: string,
    workspaceId: string,
    input: ReorderTaskInput
) {
    const task = await prisma.task.findFirst({
        where: { id: taskId, project: { workspaceId } },
    });

    if (!task) {
        throw new Error("Task not found in this workspace");
    }

    const newOrderIndex = calculateOrderIndex(input.prevOrderIndex, input.nextOrderIndex);

    return prisma.task.update({
        where: { id: taskId },
        data: {
            status: input.status,
            orderIndex: newOrderIndex,
        },
    });
}

// ---------------------------------------------------------------------------
// RULE OF 3 DAILY FOCUS DOCKET ENGINE
// ---------------------------------------------------------------------------

export async function getDailyDocket(userId: string, dateStr: string) {
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

    return prisma.dailyFocusDocket.findMany({
        where: {
            userId,
            targetDate,
        },
        include: {
            task: {
                include: {
                    project: {
                        select: { id: true, title: true, colorCode: true },
                    },
                },
            },
        },
        orderBy: { tier: "asc" }, // PRIMARY first, then MOMENTUM
    });
}

export async function claimDocketSlot(userId: string, input: ClaimDocketInput) {
    const targetDate = new Date(`${input.targetDate}T00:00:00.000Z`);

    // Count existing dockets for the day
    const existingDockets = await prisma.dailyFocusDocket.findMany({
        where: { userId, targetDate },
    });

    const primaryCount = existingDockets.filter((d) => d.tier === "PRIMARY").length;
    const momentumCount = existingDockets.filter((d) => d.tier === "MOMENTUM").length;

    if (input.tier === "PRIMARY" && primaryCount >= 1) {
        throw new Error("Daily Primary Milestone limit reached (Strictly 1 allowed per day)");
    }

    if (input.tier === "MOMENTUM" && momentumCount >= 2) {
        throw new Error("Daily Momentum Tasks limit reached (Strictly 2 allowed per day)");
    }

    return prisma.dailyFocusDocket.create({
        data: {
            userId,
            taskId: input.taskId,
            targetDate,
            tier: input.tier,
        },
        include: {
            task: true,
        },
    });
}

export async function toggleDocketCompletion(docketId: string, userId: string) {
    const docket = await prisma.dailyFocusDocket.findFirst({
        where: { id: docketId, userId },
    });

    if (!docket) {
        throw new Error("Docket item not found");
    }

    const nextState = !docket.isCompleted;

    return prisma.$transaction(async (tx) => {
        const updated = await tx.dailyFocusDocket.update({
            where: { id: docketId },
            data: {
                isCompleted: nextState,
                completedAt: nextState ? new Date() : null,
            },
        });

        // If docket is completed, automatically mark the underlying Kanban task as DONE
        if (nextState) {
            await tx.task.update({
                where: { id: docket.taskId },
                data: { status: "DONE" },
            });
        }

        return updated;
    });
}