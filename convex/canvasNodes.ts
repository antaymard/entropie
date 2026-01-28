import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { canvasNodesSchema } from "./schemas_and_validators/canvasesSchema";

export const add = mutation({
  args: {
    canvasNodes: v.array(canvasNodesSchema),
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { canvasNodes, canvasId }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError("Canvas not found");
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError("Unauthorized");
    }

    await ctx.db.patch(canvasId, {
      nodes: [...(canvas.nodes || []), ...canvasNodes],
    });

    console.log(`✅ Added ${canvasNodes.length} nodes to canvas ${canvasId}`);

    return true;
  },
});
