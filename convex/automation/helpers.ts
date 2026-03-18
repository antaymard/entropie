import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import {
  automationProgressValidator,
  nodeDataStatusValidator,
} from "../schemas/nodeDatasSchema";
import * as NodeDataModel from "../model/nodeData";

export const updateStatus = internalMutation({
  args: {
    _id: v.id("nodeDatas"),
    status: nodeDataStatusValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return NodeDataModel.updateStatus(ctx, args);
  },
});

export const updateAutomationProgress = internalMutation({
  args: {
    _id: v.id("nodeDatas"),
    automationProgress: automationProgressValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return NodeDataModel.updateAutomationProgress(ctx, args);
  },
});

export const readNodeData = internalQuery({
  args: { _id: v.id("nodeDatas") },
  handler: async (ctx, args) => {
    return NodeDataModel.readNodeData(ctx, args);
  },
});

export const listNodeDataDependencies = internalQuery({
  args: {
    type: v.union(v.literal("input"), v.literal("output"), v.literal("both")),
    nodeDataId: v.id("nodeDatas"),
  },
  handler: async (ctx, { type, nodeDataId }) => {
    return NodeDataModel.listNodeDataDependencies(ctx, {
      type,
      nodeDataId,
    });
  },
});
