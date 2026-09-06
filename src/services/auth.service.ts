import { prisma } from "../lib/prisma.js";
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    verifyRefreshToken,
} from "../lib/auth.js";
import { RegisterInput, LoginInput } from "../schemas/auth.schema.js";

export async function register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
    });

    if (existing) {
        throw new Error("Email already registered");
    }

    const passwordHash = await hashPassword(input.password);

    // Atomic transaction: Create User + Provision default Personal Workspace
    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: input.email.toLowerCase(),
                passwordHash,
                fullName: input.fullName,
            },
        });

        const personalWorkspace = await tx.workspace.create({
            data: {
                name: `${input.fullName.split(" ")[0]}'s Personal Space`,
                slug: `personal-${user.id.slice(0, 8)}`,
                type: "PERSONAL",
                ownerId: user.id,
            },
        });

        await tx.workspaceMember.create({
            data: {
                workspaceId: personalWorkspace.id,
                userId: user.id,
                role: "OWNER",
            },
        });

        return { user, personalWorkspace };
    });

    const tokenPayload = { userId: result.user.id, email: result.user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
        data: {
            userId: result.user.id,
            tokenHash: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    return {
        user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.fullName,
            personalWorkspaceId: result.personalWorkspace.id,
        },
        accessToken,
        refreshToken,
    };
}

export async function login(input: LoginInput) {
    const user = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
        include: {
            ownedWorkspaces: {
                where: { type: "PERSONAL" },
                take: 1,
            },
        },
    });

    if (!user || !user.passwordHash) {
        throw new Error("Invalid email or password");
    }

    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
        throw new Error("Invalid email or password");
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            personalWorkspaceId: user.ownedWorkspaces[0]?.id || null,
        },
        accessToken,
        refreshToken,
    };
}

export async function refreshTokens(rawRefreshToken: string) {
    const payload = verifyRefreshToken(rawRefreshToken);
    const hashed = hashToken(rawRefreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashed },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
        throw new Error("Invalid or expired refresh token");
    }

    // Revoke previous token (Token Rotation defense against replay attacks)
    await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
    });

    const newPayload = { userId: payload.userId, email: payload.email };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await prisma.refreshToken.create({
        data: {
            userId: payload.userId,
            tokenHash: hashToken(newRefreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(rawRefreshToken: string) {
    const hashed = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
        where: { tokenHash: hashed },
        data: { revoked: true },
    });
}

export const authService = {
    register,
    login,
    refreshTokens,
    logout,
};

// Backward-compatible alias
export const AuthService = authService;