import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { optionalAuth, requireAuth, requireCanvasAccess } from "./lib/auth";
import * as NodeDataModel from "./models/nodeDataModels";
import { shouldTranscribe } from "./models/nodeDataModels";
import {
  agentConfigValidator,
  dataProcessingValidator,
  nodeDatasValidator,
} from "./schemas/nodeDatasSchema";
export const create = mutation({
  args: nodeDatasValidator,
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const nodeDataId = await ctx.db.insert("nodeDatas", {
      ...args,
    });

    return nodeDataId;
  },
  returns: v.id("nodeDatas"),
});

export const read = query({
  args: { nodeDataId: v.id("nodeDatas") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const nodeData = await ctx.db.get(args.nodeDataId);
    return nodeData ?? null;
  },
});

export const listByCanvasId = query({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    const authUserId = await optionalAuth(ctx);
    const { canvas } = await requireCanvasAccess(
      ctx,
      canvasId,
      authUserId,
      "viewer",
      { allowPublic: true },
    );

    // Extraire les nodeDataIds des nodes du canvas
    const nodeDataIds = (canvas.nodes || [])
      .map((node) => node.nodeDataId)
      .filter((id): id is Id<"nodeDatas"> => id !== undefined);

    if (nodeDataIds.length === 0) return [];

    // Fetch les nodeDatas en parallèle
    const nodeDatas = await Promise.all(
      nodeDataIds.map((id) => ctx.db.get(id)),
    );

    // Filtrer les nulls (au cas où un nodeData aurait été supprimé)
    return nodeDatas.filter((nd) => nd !== null);
  },
});

// TODO : use NodeConfiig to validate values schema based on type
export const updateValues = mutation({
  args: {
    _id: v.id("nodeDatas"),
    values: v.record(v.string(), v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, { _id, values }): Promise<boolean> => {
    await requireAuth(ctx);
    const result = await NodeDataModel.updateValues(ctx, { _id, values });

    const nodeData = await ctx.db.get(_id);
    if (nodeData && shouldTranscribe(nodeData.type, Object.keys(values))) {
      await ctx.scheduler.runAfter(
        0,
        internal.ia.helpers.transcriptGenerator.transcribeNode,
        { nodeDataId: _id },
      );
    }

    return result;
  },
});

export const updateAutomationSettings = mutation({
  args: {
    _id: v.id("nodeDatas"),
    automationMode: v.optional(
      v.union(
        v.literal("agent"),
        v.literal("dataProcessing"),
        v.literal("off"),
      ),
    ),
    agent: v.optional(agentConfigValidator),
    dataProcessing: v.optional(v.array(dataProcessingValidator)),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const existing = await ctx.db.get(args._id);
    if (!existing) throw new ConvexError("NodeData non trouvé");

    await ctx.db.patch(args._id, {
      automationMode: args.automationMode,
      agent: args.agent,
      dataProcessing: args.dataProcessing,
    });
    return true;
  },
});
