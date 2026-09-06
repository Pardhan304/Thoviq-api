import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/auth.js";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
            return;
        }

        const token = authHeader.split(" ")[1];
        const payload = verifyAccessToken(token);

        req.user = {
            id: payload.userId,
            email: payload.email,
        };

        next();
    } catch (err: any) {
        res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
    }
}
