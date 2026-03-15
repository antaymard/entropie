import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAuth, requireCanvasAccess } from "./lib/auth";

export const getLastModified = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await requireAuth(ctx);

    // Récupérer le dernier canvas modifié de l'utilisateur
    const canvas = await ctx.db
      .query("canvases")
      .withIndex("by_creator_and_updatedAt", (q) =>
        q.eq("creatorId", authUserId),
      )
      .order("desc")
      .first();

    return { success: true, canvas };
  },
});

export const listUserCanvases = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await requireAuth(ctx);

    // Canvas de l'utilisateur
    const ownCanvases = await ctx.db
      .query("canvases")
      .withIndex("by_creator", (q) => q.eq("creatorId", authUserId))
      .collect();

    // Canvas partagés avec l'utilisateur
    const shares = await ctx.db
      .query("shares")
      .withIndex("by_user", (q) => q.eq("userId", authUserId))
      .collect();

    const sharedCanvases = await Promise.all(
      shares
        .filter((s) => s.resourceType === "canvas")
        .map(async (share) => {
          const canvas = await ctx.db.get(share.canvasId);
          if (!canvas) return null;
          return {
            _id: canvas._id,
            name: canvas.name,
            shared: true as const,
            permission: share.permission,
          };
        }),
    );

    return [
      ...ownCanvases.map((c) => ({
        _id: c._id,
        name: c.name,
      })),
      ...sharedCanvases.filter((c) => c !== null),
    ];
  },
});

export const readCanvas = query({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { canvasId }) => {
    const authUserId = await requireAuth(ctx);
    const { canvas, permission } = await requireCanvasAccess(
      ctx,
      canvasId,
      authUserId,
    );

    return { ...canvas, _permission: permission };
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

export const updateProps = mutation({
  args: {
    canvasId: v.id("canvases"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const authUserId = await requireAuth(ctx);
    await requireCanvasAccess(ctx, args.canvasId, authUserId, "owner");

    await ctx.db.patch(args.canvasId, {
      name: args.name,
      updatedAt: Date.now(),
    });

    return args.canvasId;
  },
});

export const deleteCanvas = mutation({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { canvasId }) => {
    const authUserId = await requireAuth(ctx);
    const { canvas } = await requireCanvasAccess(
      ctx,
      canvasId,
      authUserId,
      "owner",
    );

    // Supprimer les partages associés
    const shares = await ctx.db
      .query("shares")
      .withIndex("by_canvas", (q) => q.eq("canvasId", canvasId))
      .collect();
    for (const share of shares) {
      await ctx.db.delete(share._id);
    }

    // Supprimer le canvas
    await ctx.db.delete(canvasId);
    return canvasId;
  },
});
