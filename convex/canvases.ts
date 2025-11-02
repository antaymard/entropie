import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getLastModifiedCanvas = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);

        if (!userId) {
            return null;
        }

        // Récupérer tous les canvas de l'utilisateur, triés par _creationTime décroissant
        const canvases = await ctx.db
            .query("canvases")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .first();

        return canvases;
    },
});
