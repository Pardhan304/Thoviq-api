import { GoogleGenAI, Type, Schema } from "@google/genai";
import { env } from "../../config/env.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export interface CrystallizedConcept {
    title: string;
    technology: string;
    category: string;
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    summary: string;
    keyPoints: string[];
    codeExamples: Array<{ language: string; code: string }>;
    tags: string[];
    quizQuestions: Array<{
        question: string;
        options: string[];
        correctAnswerIndex: number;
        explanation: string;
    }>;
    suggestedTasks: Array<{
        title: string;
        description: string;
    }>;
}

const crystallizationSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "Clear, concise technical concept title" },
        technology: { type: Type.STRING, description: "Primary tech stack, e.g. React, PostgreSQL, Docker" },
        category: { type: Type.STRING, description: "Domain, e.g. Frontend, Backend, AI/ML, DevOps" },
        difficulty: {
            type: Type.STRING,
            enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
        },
        summary: { type: Type.STRING, description: "High-density technical summary of the concept" },
        keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5 high-yield takeaway bullet points",
        },
        codeExamples: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    language: { type: Type.STRING },
                    code: { type: Type.STRING },
                },
                required: ["language", "code"],
            },
        },
        tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        },
        quizQuestions: {
            type: Type.ARRAY,
            description: "Exactly 3 multiple-choice questions testing active recall",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Exactly 4 options",
                    },
                    correctAnswerIndex: { type: Type.INTEGER, description: "0-indexed correct option" },
                    explanation: { type: Type.STRING },
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"],
            },
        },
        suggestedTasks: {
            type: Type.ARRAY,
            description: "2-3 actionable 15-minute micro-tasks to practice this concept",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                },
                required: ["title", "description"],
            },
        },
    },
    required: [
        "title",
        "technology",
        "category",
        "difficulty",
        "summary",
        "keyPoints",
        "codeExamples",
        "tags",
        "quizQuestions",
        "suggestedTasks",
    ],
};

export async function crystallizeContentWithGemini(
    rawContent: string,
    sourceTitle: string
): Promise<CrystallizedConcept> {
    const prompt = `
You are a senior technical architect analyzing raw saved developer content (reels, docs, tweets, notes).
Transform this raw technical dump into high-yield, structured knowledge.

Source Reference Title: "${sourceTitle}"

Raw Content:
"""
${rawContent.slice(0, 15000)}
"""

Extract the fundamental developer concept, provide working code snippets if relevant, generate 3 active-recall quiz questions, and create 2-3 actionable micro-tasks. Return strict JSON.
`;

    // Fallback chain: if one model encounters high demand or errors, fall back to next model
    const candidateModels = [
        "gemini-2.0-flash",
        // "gemini-2.5-flash",
        // "gemini-1.5-flash",
    ];

    let lastError: unknown;

    for (const model of candidateModels) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: crystallizationSchema,
                    temperature: 0.2,
                },
            });

            const responseText = response.text;
            if (responseText) {
                return JSON.parse(responseText) as CrystallizedConcept;
            }
        } catch (err: any) {
            lastError = err;
            console.warn(`[AI Engine] Model ${model} unavailable (${err?.message || err}). Attempting fallback...`);
            // Short delay before testing the next candidate model
            await new Promise((r) => setTimeout(r, 600));
        }
    }

    throw new Error(
        `All AI crystallization model tiers failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
}


