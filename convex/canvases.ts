import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getLastModifiedCanvas = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);

    if (!authUserId) {
      throw new Error("Utilisateur non authentifié");
    }

    // Récupérer tous les canvas de l'utilisateur, triés par _creationTime décroissant
    const canvases = await ctx.db
      .query("canvases")
      .withIndex("by_creator", (q) => q.eq("creatorId", authUserId))
      .order("desc")
      .first();

    return canvases;
  },
});

export const createCanvas = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const authUserId = await getAuthUserId(ctx);

    if (!authUserId) {
      throw new Error("Utilisateur non authentifié");
    }

    // Retourne l'id seulement
    const newCanvasId = await ctx.db.insert("canvases", {
      creatorId: authUserId,
      name,
    });

    return newCanvasId;
  },
});
