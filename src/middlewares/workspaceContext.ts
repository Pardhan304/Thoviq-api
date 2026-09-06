import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export function requireWorkspace(_minimumRole?: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const workspaceId =
                (req.headers["x-workspace-id"] as string) ||
                (req.query.workspaceId as string);

            if (!workspaceId) {
                res.status(400).json({
                    success: false,
                    message: "Active workspace ID is required (header: x-workspace-id or query: workspaceId)",
                });
                return;
            }

            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "User not authenticated" });
                return;
            }

            const member = await prisma.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId,
                        userId,
                    },
                },
            });

            if (!member) {
                res.status(403).json({
                    success: false,
                    message: "You are not a member of this workspace",
                });
                return;
            }

            req.workspaceContext = {
                workspaceId,
                role: member.role,
            };

            next();
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: err.message || "Failed to resolve workspace context",
            });
        }
    };
}
