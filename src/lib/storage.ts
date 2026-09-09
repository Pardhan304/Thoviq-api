import { createClient } from "@supabase/supabase-js";
import { env } from "../../config/env.js";

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export async function createPresignedUploadUrl(
    filePath: string
): Promise<{ signedUrl: string; token: string; path: string }> {
    const { data, error } = await supabase.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .createSignedUploadUrl(filePath);

    if (error || !data) {
        throw new Error(`Failed to create presigned upload URL: ${error?.message}`);
    }

    return {
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path,
    };
}

export async function getPresignedViewUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresIn);

    if (error || !data) {
        throw new Error(`Failed to generate signed view URL: ${error?.message}`);
    }

    return data.signedUrl;
}