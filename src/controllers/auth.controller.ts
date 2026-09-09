import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import { getErrorMessage } from "../lib/errors.js";

const COOKIE_NAME = "thoviq_refresh";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const validated = registerSchema.parse(req.body);
        const result = await authService.register(validated);

        res.cookie(COOKIE_NAME, result.refreshToken, cookieOptions);
        res.status(201).json({
            success: true,
            user: result.user,
            accessToken: result.accessToken,
        });
    } catch (err: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const validated = loginSchema.parse(req.body);
        const result = await authService.login(validated);

        res.cookie(COOKIE_NAME, result.refreshToken, cookieOptions);
        res.status(200).json({
            success: true,
            user: result.user,
            accessToken: result.accessToken,
        });
    } catch (err: unknown) {
        res.status(401).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function refresh(req: Request, res: Response): Promise<void> {
    try {
        const token = req.cookies[COOKIE_NAME];
        if (!token) {
            res.status(401).json({ success: false, message: "Missing refresh token" });
            return;
        }

        const tokens = await authService.refreshTokens(token);
        res.cookie(COOKIE_NAME, tokens.refreshToken, cookieOptions);
        res.status(200).json({ success: true, accessToken: tokens.accessToken });
    } catch (err: unknown) {
        res.status(401).json({ success: false, message: getErrorMessage(err) });
    }
}

export async function logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies[COOKIE_NAME];
    if (token) {
        await authService.logout(token).catch(() => null);
    }
    res.clearCookie(COOKIE_NAME);
    res.status(200).json({ success: true, message: "Logged out successfully" });
}

export const authController = {
    register,
    login,
    refresh,
    logout,
};

// Backward-compatible alias
export const AuthController = authController;