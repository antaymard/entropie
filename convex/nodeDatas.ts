import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";
import nodeDatasSchema from "./schemas_and_validators/nodeDatasSchema";

export const create = mutation({
  args: nodeDatasSchema.omit("_id"),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const nodeDataId = await ctx.db.insert("nodeDatas", {
      ...args,
    });

    return nodeDataId;
  },
  returns: v.id("nodeDatas"),
});

export const listByCanvasId = query({
  args: { canvasId: v.id("canvases") },
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
  handler: async (ctx, { _id, values }) => {
    await requireAuth(ctx);
    const existing = await ctx.db.get(_id);
    if (!existing) throw new ConvexError("NodeData non trouvé");

    await ctx.db.patch(_id, {
      values: { ...existing.values, ...values },
      updatedAt: Date.now(),
    });
    return true;
  },
  returns: v.boolean(),
});

export const updateAutomationSettings = mutation({
  args: nodeDatasSchema.pick(
    "_id",
    "automationMode",
    "agent",
    "dataProcessing",
  ),
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
