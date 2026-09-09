import { prisma } from "../lib/prisma.js";
import { crystallizeContentWithGemini } from "../lib/ai.js";

export async function processAndCrystallizeAsset(assetId: string, workspaceId: string) {
    const asset = await prisma.knowledgeAsset.findFirst({
        where: { id: assetId, workspaceId },
    });

    if (!asset) {
        throw new Error("Knowledge asset not found in this workspace");
    }

    if (!asset.rawContent && !asset.title) {
        throw new Error("Asset has no content to analyze");
    }

    const contentToAnalyze = asset.rawContent || asset.title;

    // Run structured extraction via Gemini Flash
    const extracted = await crystallizeContentWithGemini(contentToAnalyze, asset.title);

    return prisma.$transaction(async (tx) => {
        // 1. Deduplication check: Match by technology and exact title
        let knowledgeItem = await tx.knowledgeItem.findFirst({
            where: {
                workspaceId,
                technology: { equals: extracted.technology, mode: "insensitive" },
                title: { equals: extracted.title, mode: "insensitive" },
            },
        });

        if (knowledgeItem) {
            // Concept exists: Attach asset as a supporting source and append tags
            const mergedTags = Array.from(new Set([...knowledgeItem.tags, ...extracted.tags]));
            knowledgeItem = await tx.knowledgeItem.update({
                where: { id: knowledgeItem.id },
                data: {
                    tags: mergedTags,
                },
            });
        } else {
            // Create a new KnowledgeItem concept card
            knowledgeItem = await tx.knowledgeItem.create({
                data: {
                    workspaceId,
                    projectId: asset.projectId,
                    title: extracted.title,
                    technology: extracted.technology,
                    category: extracted.category,
                    difficulty: extracted.difficulty,
                    summary: extracted.summary,
                    keyPoints: extracted.keyPoints,
                    codeExamples: extracted.codeExamples,
                    tags: extracted.tags,
                },
            });

            // Generate 3 Active Recall Quiz questions for spaced repetition
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            for (const q of extracted.quizQuestions) {
                await tx.quiz.create({
                    data: {
                        projectId: asset.projectId,
                        knowledgeItemId: knowledgeItem.id,
                        question: q.question,
                        options: q.options,
                        correctAnswerIndex: q.correctAnswerIndex,
                        explanation: q.explanation,
                        dueDate: tomorrow,
                        intervalDays: 1,
                    },
                });
            }

            // If the asset belongs to a project, auto-decompose micro-tasks on the Kanban board
            if (asset.projectId) {
                let orderOffset = 1000.0;
                for (const task of extracted.suggestedTasks) {
                    await tx.task.create({
                        data: {
                            projectId: asset.projectId,
                            creatorId: asset.creatorId,
                            title: task.title,
                            description: task.description,
                            status: "BACKLOG",
                            priority: "MEDIUM",
                            weight: 1, // Micro-action (15m)
                            orderIndex: orderOffset,
                        },
                    });
                    orderOffset += 1000.0;
                }
            }
        }

        // Link the source asset to the knowledge card
        const updatedAsset = await tx.knowledgeAsset.update({
            where: { id: assetId },
            data: {
                knowledgeItemId: knowledgeItem.id,
                aiSummary: extracted.summary,
            },
        });

        return {
            knowledgeItem,
            asset: updatedAsset,
            quizCount: extracted.quizQuestions.length,
            tasksGenerated: asset.projectId ? extracted.suggestedTasks.length : 0,
        };
    });
}

export async function listKnowledgeItems(workspaceId: string, category?: string) {
    return prisma.knowledgeItem.findMany({
        where: {
            workspaceId,
            ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
        },
        include: {
            sources: {
                select: {
                    id: true,
                    type: true,
                    title: true,
                    sourceUrl: true,
                    storagePath: true,
                    thumbnailUrl: true,
                    authorName: true,
                },
            },
            _count: {
                select: { sources: true, quizzes: true },
            },
        },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getKnowledgeItemDetails(knowledgeItemId: string, workspaceId: string) {
    const item = await prisma.knowledgeItem.findFirst({
        where: { id: knowledgeItemId, workspaceId },
        include: {
            sources: true,
            quizzes: true,
            project: {
                select: { id: true, title: true, colorCode: true },
            },
        },
    });

    if (!item) {
        throw new Error("Knowledge item not found");
    }

    return item;
}

export async function convertKnowledgeToProject(
    knowledgeItemId: string,
    workspaceId: string,
    userId: string
) {
    const item = await prisma.knowledgeItem.findFirst({
        where: { id: knowledgeItemId, workspaceId },
    });

    if (!item) {
        throw new Error("Knowledge item not found");
    }

    return prisma.$transaction(async (tx) => {
        // 1. Create a Project born from this concept card
        const project = await tx.project.create({
            data: {
                workspaceId,
                ownerId: userId,
                originKnowledgeId: item.id,
                title: `Build: ${item.title}`,
                description: item.summary,
                colorCode: "#6366F1",
            },
        });

        // 2. Link this KnowledgeItem to the newly generated Project
        await tx.knowledgeItem.update({
            where: { id: item.id },
            data: { projectId: project.id },
        });

        // 3. Convert key points into Kanban tasks
        const keyPoints = Array.isArray(item.keyPoints) ? (item.keyPoints as string[]) : [];
        let orderIndex = 1000.0;

        for (const point of keyPoints) {
            await tx.task.create({
                data: {
                    projectId: project.id,
                    creatorId: userId,
                    title: point.length > 80 ? point.slice(0, 77) + "..." : point,
                    description: point,
                    status: "TODO",
                    weight: 1,
                    orderIndex,
                },
            });
            orderIndex += 1000.0;
        }

        return project;
    });
}