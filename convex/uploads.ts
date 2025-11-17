import { v } from "convex/values";
import { action } from "./_generated/server";
import { generatePresignedUrl, getPublicUrl } from "./lib/r2";
import { requireAuth } from "./lib/auth";

// Single file upload - Action publique
export const generateUploadUrl = action({
  args: {
    filename: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const uniqueId = crypto.randomUUID();
    const sanitizedFilename = args.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${userId}/${uniqueId}_${sanitizedFilename}`;

    const uploadUrl = await generatePresignedUrl(key, args.mimeType);
    const publicUrl = getPublicUrl(key);

    return {
      uploadUrl, // Pour le PUT du client
      publicUrl, // À sauvegarder dans le node après upload
      key, // Pour référence/delete futur
    };
  },
});

// Multiple files upload - Action publique
export const generateUploadUrls = action({
  args: {
    files: v.array(
      v.object({
        filename: v.string(),
        mimeType: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    return Promise.all(
      args.files.map(async (file) => {
        const uniqueId = crypto.randomUUID();
        const sanitizedFilename = file.filename.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );
        const key = `${userId}/${uniqueId}_${sanitizedFilename}`;

        const uploadUrl = await generatePresignedUrl(key, file.mimeType);
        const publicUrl = getPublicUrl(key);

        return { uploadUrl, publicUrl, key };
      })
    );
  },
});

