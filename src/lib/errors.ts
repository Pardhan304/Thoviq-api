/**
 * Centralized error handling utilities.
 * Replaces `catch (err: any)` with type-safe error extraction.
 */

export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}

/**
 * Safely extract an error message from an unknown thrown value.
 */
export function getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    if (typeof err === "string") {
        return err;
    }
    return "An unexpected error occurred";
}

/**
 * Extract both message and status code from an error.
 * Uses `AppError.statusCode` if available, otherwise falls back to `fallbackStatus`.
 */
export function getErrorDetails(
    err: unknown,
    fallbackStatus: number
): { message: string; statusCode: number } {
    const message = getErrorMessage(err);
    const statusCode =
        err instanceof AppError ? err.statusCode : fallbackStatus;
    return { message, statusCode };
}
