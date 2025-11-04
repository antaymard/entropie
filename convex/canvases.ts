import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

export const getLastModifiedCanvas = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await requireAuth(ctx);

    // Récupérer tous les canvas de l'utilisateur, triés par _creationTime décroissant
    const canvases = await ctx.db
      .query("canvases")
      .withIndex("by_creator", (q) => q.eq("creatorId", authUserId))
      .order("desc")
      .first();

    return canvases;
  },
});

export const getUserCanvases = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await requireAuth(ctx);

    // Récupérer tous les canvas de l'utilisateur
    const canvases = await ctx.db
      .query("canvases")
      .withIndex("by_creator", (q) => q.eq("creatorId", authUserId))
      .collect();

    return canvases;
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
      createdAt: 0,
      updatedAt: 0,
    });

    return newCanvasId;
  },
});

export const getCanvas = query({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { canvasId }) => {
    const authUserId = await requireAuth(ctx);

    // Vérifier si l'utilisateur est le créateur du canvas
    const canvas = await ctx.db.get(canvasId);

    if (!canvas) {
      throw new Error("Canvas non trouvé");
    }

    if (canvas.creatorId !== authUserId) {
      throw new Error("Vous n'avez pas accès à ce canvas");
    }

    return canvas;
  },
});

export const updateCanvasDetails = mutation({
  args: {
    canvasId: v.id("canvases"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { canvasId, ...updates }) => {
    const authUserId = await requireAuth(ctx);

    // Vérifier si l'utilisateur est le créateur du canvas
    const canvas = await ctx.db.get(canvasId);

    if (!canvas) {
      throw new Error("Canvas non trouvé");
    }

    if (canvas.creatorId !== authUserId) {
      throw new Error("Vous n'avez pas accès à ce canvas");
    }

    // Ne garder que les champs définis (non-undefined)
    const fieldsToUpdate = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    // Mettre à jour les métadonnées du canvas
    await ctx.db.patch(canvasId, {
      ...fieldsToUpdate,
      updatedAt: Date.now(),
    });

    return canvasId;
  },
});

export const updateCanvasContent = mutation({
  args: {
    canvasId: v.id("canvases"),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
  },
  handler: async (ctx, { canvasId, nodes, edges }) => {
    const authUserId = await requireAuth(ctx);

    console.log(nodes);

    // Vérifier si l'utilisateur est le créateur du canvas
    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new Error("Canvas non trouvé");
    }
    if (canvas.creatorId !== authUserId) {
      throw new Error("Vous n'avez pas accès à ce canvas");
    }
    // Mettre à jour le contenu du canvas
    await ctx.db.patch(canvasId, {
      nodes,
      edges,
      updatedAt: Date.now(),
    });
    return canvasId;
  },
});
