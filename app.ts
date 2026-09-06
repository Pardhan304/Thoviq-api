import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./src/routes/auth.routes.js";
import projectRoutes from "./src/routes/project.routes.js";

export const app: Application = express();

app.use(
    cors({
        origin: env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

// Base Route Registrations
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
        status: "healthy",
        service: "thoviq-api",
        timestamp: new Date().toISOString(),
    });
});