import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./src/routes/auth.routes.js";
import workspaceRoutes from "./src/routes/workspace.routes.js";
import projectRoutes from "./src/routes/project.routes.js";
import taskRoutes from "./src/routes/task.routes.js";
import ingestionRoutes from "./src/routes/ingestion.routes.js";
import crystallizationRoutes from "./src/routes/crystallization.routes.js";
import quizRoutes from "./src/routes/quiz.routes.js";

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
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ingestion", ingestionRoutes);
app.use("/api/knowledge", crystallizationRoutes);
app.use("/api/quizzes", quizRoutes);

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
        status: "healthy",
        service: "thoviq-api",
        timestamp: new Date().toISOString(),
    });
});