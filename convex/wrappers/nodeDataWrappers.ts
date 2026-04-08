import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import {
  automationProgressValidator,
  nodeDataStatusValidator,
} from "../schemas/nodeDatasSchema";
import { nodeTypeValidator } from "../schemas/nodeTypeSchema";

import * as NodeDataModels from "../models/nodeDataModels";

export const create = internalMutation({
  args: {
    type: nodeTypeValidator,
    values: v.record(v.string(), v.any()),
    canvasId: v.id("canvases"),
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
    return NodeDataModels.updateValues(ctx, args);
  },
});

export const deleteWithCascade = internalMutation({
  args: { nodeDataId: v.id("nodeDatas") },
  returns: v.null(),
  handler: async (ctx, { nodeDataId }) => {
    await NodeDataModels.deleteNodeDataWithCascade(ctx, { nodeDataId });
    return null;
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
