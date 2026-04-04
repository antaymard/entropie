import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  automationProgressValidator,
  nodeDataStatusValidator,
} from "../schemas/nodeDatasSchema";
import { nodeTypeValidator } from "../schemas/nodeTypeSchema";

import * as NodeDataModels from "../models/nodeDataModels";
import { shouldTranscribe } from "../models/nodeDataModels";

export const create = internalMutation({
  args: {
    type: nodeTypeValidator,
    values: v.record(v.string(), v.any()),
    canvasId: v.optional(v.id("canvases")),
  },
  returns: v.id("nodeDatas"),
  handler: async (ctx, args) => {
    return NodeDataModels.createNodeData(ctx, args);
  },
});

export const updateStatus = internalMutation({
  args: {
    _id: v.id("nodeDatas"),
    status: nodeDataStatusValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return NodeDataModels.updateStatus(ctx, args);
  },
});

export const updateAutomationProgress = internalMutation({
  args: {
    _id: v.id("nodeDatas"),
    automationProgress: automationProgressValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return NodeDataModels.updateAutomationProgress(ctx, args);
  },
});

export const updateValues = internalMutation({
  args: {
    _id: v.id("nodeDatas"),
    values: v.record(v.string(), v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const result = await NodeDataModels.updateValues(ctx, args);

    const nodeData = await ctx.db.get(args._id);
    if (nodeData && shouldTranscribe(nodeData.type, Object.keys(args.values))) {
      await ctx.scheduler.runAfter(
        0,
        internal.ia.helpers.transcriptGenerator.transcribeNode,
        { nodeDataId: args._id },
      );
    }

    return result;
  },
});

export const readNodeData = internalQuery({
  args: { _id: v.id("nodeDatas") },
  handler: async (ctx, args) => {
    return NodeDataModels.readNodeData(ctx, args);
  },
});

export const listNodeDataDependencies = internalQuery({
  args: {
    type: v.union(v.literal("input"), v.literal("output"), v.literal("both")),
    nodeDataId: v.id("nodeDatas"),
  },
  handler: async (ctx, { type, nodeDataId }) => {
    return NodeDataModels.listNodeDataDependencies(ctx, {
      type,
      nodeDataId,
    });
  },
});
