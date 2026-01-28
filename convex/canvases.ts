import { query, mutation, internalMutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAuth } from "./lib/auth";

export const listUserCanvases = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await requireAuth(ctx);

    // Récupérer tous les canvas de l'utilisateur
    const canvases = await ctx.db
      .query("canvases")
      .withIndex("by_creator", (q) => q.eq("creatorId", authUserId))
      .collect();

    // Retourner seulement l'id et le nom
    return canvases.map((canvas) => ({
      _id: canvas._id,
      name: canvas.name,
    }));
  },
});

export const readCanvas = query({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { canvasId }) => {
    // Check if canvas is public
    const canvas = await ctx.db.get(canvasId);

    if (!canvas) {
      throw new ConvexError("L'espace demandé n'existe pas.");
    }

    // Else check if the user is auth and is the creator
    const authUserId = await requireAuth(ctx);

    if (canvas.creatorId !== authUserId) {
      throw new ConvexError("Vous n'avez pas accès à cet espace.");
    }

    return canvas;
  },
});

export const createCanvas = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const authUserId = await requireAuth(ctx);

    // Retourne l'id seulement
    const newCanvasId = await ctx.db.insert("canvases", {
      creatorId: authUserId,
      name,
      nodes: [],
      edges: [],
      updatedAt: Date.now(),
    });

    return newCanvasId;
  },
});

export const deleteCanvas = mutation({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { canvasId }) => {
    const authUserId = await requireAuth(ctx);

    // Vérifier si l'utilisateur est le créateur du canvas
    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError("Ce canvas n'existe pas.");
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError("Vous n'avez pas accès à ce canvas");
    }

    // Supprimer le canvas
    await ctx.db.delete(canvasId);
    return canvasId;
  },
});
