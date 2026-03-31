import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import * as CanvasNodeModels from "../models/canvasNodeModels";
import { canvasNodesValidator } from "../schemas/canvasesSchema";

export const add = internalMutation({
  args: {
    canvasId: v.id("canvases"),
    canvasNodes: v.array(canvasNodesValidator),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return CanvasNodeModels.addCanvasNodes(ctx, {
      canvasId: args.canvasId,
      canvasNodes: args.canvasNodes,
    });
  },
});

export const updatePositionOrDimensions = internalMutation({
  args: {
    canvasId: v.id("canvases"),
    nodeChanges: v.array(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return CanvasNodeModels.updatePositionOrDimensions(ctx, {
      canvasId: args.canvasId,
      nodeChanges: args.nodeChanges,
    });
  },
});

export const updateCanvasNodes = internalMutation({
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
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return CanvasNodeModels.updateCanvasNodes(ctx, {
      canvasId: args.canvasId,
      nodeProps: args.nodeProps,
    });
  },
});

export const remove = internalMutation({
  args: {
    authUserId: v.id("users"),
    canvasId: v.id("canvases"),
    nodeCanvasIds: v.array(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return CanvasNodeModels.removeCanvasNodes(ctx, {
      authUserId: args.authUserId,
      canvasId: args.canvasId,
      nodeCanvasIds: args.nodeCanvasIds,
    });
  },
});

export const getNodeWithNodeData = internalQuery({
  args: {
    canvasId: v.id("canvases"),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    return CanvasNodeModels.getNodeWithNodeData(ctx, args);
  },
});
