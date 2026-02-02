import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { edgesSchema } from "./schemas_and_validators/canvasesSchema";
import errors from "./errorsConfig";

export const add = mutation({
  args: {
    canvasId: v.id("canvases"),
    edges: v.array(edgesSchema),
  },
  handler: async (ctx, { edges, canvasId }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }

    await ctx.db.patch(canvasId, {
      edges: [...(canvas.edges || []), ...edges],
    });

    console.log(`✅ Added ${edges.length} edges to canvas ${canvasId}`);
    return true;
  },
});

export const update = mutation({
  args: {
    canvasId: v.id("canvases"),
    edgeUpdates: v.array(
      v.object({
        id: v.string(),
        data: v.optional(v.record(v.string(), v.any())),
      })
    ),
  },
  handler: async (ctx, { canvasId, edgeUpdates }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }

    const edges = canvas.edges || [];

    const updatedEdges = edges.map((edge) => {
      const update = edgeUpdates.find((u) => u.id === edge.id);
      if (!update) return edge;

      return {
        ...edge,
        data: update.data ? { ...edge.data, ...update.data } : edge.data,
      };
    });

    await ctx.db.patch(canvasId, { edges: updatedEdges });
    console.log(`✅ Updated ${edgeUpdates.length} edges in canvas ${canvasId}`);
    return true;
  },
});

export const remove = mutation({
  args: {
    canvasId: v.id("canvases"),
    edgeIds: v.array(v.string()),
  },
  handler: async (ctx, { canvasId, edgeIds }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }

    await ctx.db.patch(canvasId, {
      edges: (canvas.edges || []).filter((edge) => !edgeIds.includes(edge.id)),
    });

    console.log(`✅ Removed ${edgeIds.length} edges from canvas ${canvasId}`);
    return true;
  },
});
