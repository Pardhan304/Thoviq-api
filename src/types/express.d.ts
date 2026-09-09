export interface WorkspaceContext {
    workspaceId: string;
    role?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
            };
            workspaceContext?: WorkspaceContext;
        }
    }
}
