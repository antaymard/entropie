import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";
import { canvasNodesValidator } from "./schemas/canvasesSchema";
import errors from "./errorsConfig";

export const add = mutation({
  args: {
    canvasId: v.id("canvases"),
    canvasNodes: v.array(canvasNodesValidator),
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
    console.log(
      `✅ Updated position/dimensions for ${nodeChanges.length} nodes in canvas ${canvasId}`,
    );
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
            variant: v.optional(v.string()),
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
        if (props.props.variant !== undefined)
          updated.variant = props.props.variant;
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

    const currentNodes = canvas.nodes || [];
    const removedNodes = currentNodes.filter((node) =>
      nodeCanvasIds.includes(node.id),
    );
    const remainingNodes = currentNodes.filter(
      (node) => !nodeCanvasIds.includes(node.id),
    );

    // Collect nodeDataIds from removed nodes
    const removedNodeDataIds = removedNodes
      .map((node) => node.nodeDataId)
      .filter((id): id is Id<"nodeDatas"> => id !== undefined);

    await ctx.db.patch(canvasId, { nodes: remainingNodes });

    // Delete orphaned nodeDatas (not referenced by any other canvas node)
    if (removedNodeDataIds.length > 0) {
      // Check if any of the remaining nodes in THIS canvas still reference these nodeDataIds
      const stillUsedInCurrentCanvas = new Set(
        remainingNodes
          .map((node) => node.nodeDataId)
          .filter((id): id is Id<"nodeDatas"> => id !== undefined),
      );

      const potentialOrphans = removedNodeDataIds.filter(
        (id) => !stillUsedInCurrentCanvas.has(id),
      );

      if (potentialOrphans.length > 0) {
        // Check all other canvases of this user
        const allCanvases = await ctx.db
          .query("canvases")
          .withIndex("by_creator", (q) => q.eq("creatorId", authUserId))
          .collect();

        const nodeDataIdsInOtherCanvases = new Set<Id<"nodeDatas">>();
        for (const otherCanvas of allCanvases) {
          if (otherCanvas._id === canvasId) continue;
          for (const node of otherCanvas.nodes || []) {
            if (node.nodeDataId) {
              nodeDataIdsInOtherCanvases.add(
                node.nodeDataId as Id<"nodeDatas">,
              );
            }
          }
        }

        const orphanedIds = potentialOrphans.filter(
          (id) => !nodeDataIdsInOtherCanvases.has(id),
        );

        for (const orphanId of orphanedIds) {
          await ctx.db.delete(orphanId);
        }

        if (orphanedIds.length > 0) {
          console.log(`🗑️ Deleted ${orphanedIds.length} orphaned nodeDatas`);
        }
      }
    }

    console.log(
      `✅ Removed ${nodeCanvasIds.length} nodes from canvas ${canvasId}`,
    );
    return true;
  },
});
