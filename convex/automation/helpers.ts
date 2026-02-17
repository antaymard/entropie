import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { nodeDatasWithIdValidator } from "../schemas/nodeDatasSchema";

export const updateStatus = internalMutation({
  args: {
    _id: nodeDatasWithIdValidator.fields._id,
    status: nodeDatasWithIdValidator.fields.status,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args._id);
    if (!existing) throw new ConvexError("NodeData non trouvé");
    await ctx.db.patch(args._id, {
      status: args.status,
    });
    return true;
  },
});

export const updateAutomationProgress = internalMutation({
  args: {
    _id: nodeDatasWithIdValidator.fields._id,
    automationProgress: nodeDatasWithIdValidator.fields.automationProgress,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args._id);
    if (!existing) throw new ConvexError("NodeData non trouvé");

    // Merge changes
    await ctx.db.patch(args._id, {
      automationProgress: args.automationProgress
        ? { ...existing.automationProgress, ...args.automationProgress }
        : args.automationProgress,
    });
    return true;
  },
});

export const readNodeData = internalQuery({
  args: { _id: nodeDatasWithIdValidator.fields._id },
  handler: async (ctx, args) => {
    const nodeData = await ctx.db.get(args._id);
    if (!nodeData) throw new ConvexError("NodeData non trouvé");
    return nodeData;
  },
});

export const listNodeDataDependencies = internalQuery({
  args: {
    type: v.union(v.literal("input"), v.literal("output"), v.literal("both")),
    nodeDataId: v.id("nodeDatas"),
  },
  handler: async (ctx, { type, nodeDataId }) => {
    const nodeData = await ctx.db.get(nodeDataId);
    if (!nodeData) throw new ConvexError("NodeData non trouvé");
    if (!nodeData.dependencies || nodeData.dependencies.length === 0) return [];

    const dependencies = nodeData.dependencies;

    const filteredDependencies = dependencies.filter((dep) => {
      if (type === "both") return true;
      return dep.type === type;
    });

    // Récupérer les objets nodeData complets pour chaque dépendance
    const detailedDependencies = await Promise.all(
      filteredDependencies.map(async (dep) => {
        const nodeData = await ctx.db.get(dep.nodeDataId);
        if (!nodeData) throw new ConvexError("NodeData dépendant non trouvé");
        return nodeData;
      }),
    );

    return detailedDependencies;
  },
});
