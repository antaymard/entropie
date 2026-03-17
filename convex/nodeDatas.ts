import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";
import { internal } from "./_generated/api";
import {
  agentConfigValidator,
  dataProcessingValidator,
  nodeDatasValidator,
  nodeDatasWithIdValidator,
} from "./schemas/nodeDatasSchema";

const ABSTRACT_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

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
  returns: v.union(nodeDatasWithIdValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const nodeData = await ctx.db.get(args.nodeDataId);
    return nodeData ?? null;
  },
});

export const listByCanvasId = query({
  args: { canvasId: v.id("canvases") },
  returns: v.array(nodeDatasWithIdValidator),
  handler: async (ctx, { canvasId }) => {
    await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) return [];

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
  handler: async (ctx, { _id, values }) => {
    await requireAuth(ctx);
    const existing = await ctx.db.get(_id);
    if (!existing) throw new ConvexError("NodeData non trouvé");

    const now = Date.now();
    await ctx.db.patch(_id, {
      values: { ...existing.values, ...values },
      updatedAt: now,
    });

    // Debounce abstract generation: cancel previous scheduled job if pending
    const existingJob = await ctx.db
      .query("scheduledJobs")
      .withIndex("by_nodeDataId", (q) => q.eq("nodesDataId", _id))
      .first();

    if (existingJob) {
      const job = await ctx.db.system.get(existingJob.jobId);
      if (job && job.state.kind === "pending") {
        await ctx.scheduler.cancel(existingJob.jobId);
      }
      await ctx.db.delete(existingJob._id);
    }

    const scheduledId = await ctx.scheduler.runAfter(
      ABSTRACT_DEBOUNCE_MS,
      internal.ia.abstractor.AbstractAgent.abstractNodeData,
      { nodeDataId: _id },
    );
    await ctx.db.insert("scheduledJobs", {
      type: "generate-node-data-abstract",
      nodesDataId: _id,
      scheduledAt: now + ABSTRACT_DEBOUNCE_MS,
      jobId: scheduledId,
    });

    return true;
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
