import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { canvasNodesSchema } from "./schemas_and_validators/canvasesSchema";
import errors from "./errorsConfig";

export const add = mutation({
  args: {
    canvasId: v.id("canvases"),
    canvasNodes: v.array(canvasNodesSchema),
  },
  handler: async (ctx, { canvasNodes, canvasId }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }

    await ctx.db.patch(canvasId, {
      nodes: [...(canvas.nodes || []), ...canvasNodes],
    });

    console.log(`✅ Added ${canvasNodes.length} nodes to canvas ${canvasId}`);

    return true;
  },
});

export const updatePositionOrDimensions = mutation({
  args: {
    canvasId: v.id("canvases"),
    nodeChanges: v.array(v.any()), // NodeChange[] de reactflow
  },
  handler: async (ctx, { canvasId, nodeChanges }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }

    const nodes = canvas.nodes || [];

    const updatedNodes = nodes.map((node) => {
      const change = nodeChanges.find((c) => c.id === node.id);
      if (!change) return node;

      const updated = { ...node };

      if (change.position) {
        updated.position = {
          x: change.position.x,
          y: change.position.y,
        };
      }

      if (change.dimensions) {
        updated.width = change.dimensions.width;
        updated.height = change.dimensions.height;
      }

      return updated;
    });

    await ctx.db.patch(canvasId, { nodes: updatedNodes });

    return true;
  },
});

export const updateCanvasNodes = mutation({
  args: {
    canvasId: v.id("canvases"),
    nodeProps: v.array(
      v.object({
        id: v.string(),
        props: v.optional(
          v.object({
            locked: v.optional(v.boolean()),
            hidden: v.optional(v.boolean()),
            zIndex: v.optional(v.number()),
            color: v.optional(v.string()),
          }),
        ),
        data: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, { canvasId, nodeProps }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);

    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }

    const nodes = canvas.nodes || [];

    const updatedNodes = nodes.map((node) => {
      const props = nodeProps.find((p) => p.id === node.id);
      if (!props) return node;

      const updated = { ...node };

      // Appliquer les props structurelles (locked, hidden, zIndex, color)
      if (props.props) {
        if (props.props.locked !== undefined)
          updated.locked = props.props.locked;
        if (props.props.hidden !== undefined)
          updated.hidden = props.props.hidden;
        if (props.props.zIndex !== undefined)
          updated.zIndex = props.props.zIndex;
        if (props.props.color !== undefined) updated.color = props.props.color;
      }

      // Appliquer les data custom
      if (props.data) {
        updated.data = { ...node.data, ...props.data };
      }

      return updated;
    });

    await ctx.db.patch(canvasId, { nodes: updatedNodes });

    console.log(
      `✅ Updated display props for ${nodeProps.length} nodes in canvas ${canvasId}`,
    );

    return true;
  },
});

export const remove = mutation({
  args: {
    canvasId: v.id("canvases"),
    nodeCanvasIds: v.array(v.string()),
  },
  handler: async (ctx, { canvasId, nodeCanvasIds }) => {
    const authUserId = await requireAuth(ctx);
    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }
    await ctx.db.patch(canvasId, {
      nodes: (canvas.nodes || []).filter(
        (node) => !nodeCanvasIds.includes(node.id),
      ),
    });

    console.log(
      `✅ Removed ${nodeCanvasIds.length} nodes from canvas ${canvasId}`,
    );
    return true;
  },
});
