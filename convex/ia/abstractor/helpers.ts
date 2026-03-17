import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import { nodeDatasWithIdValidator } from "../../schemas/nodeDatasSchema";

export const readNodeData = internalQuery({
  args: { nodeDataId: v.id("nodeDatas") },
  returns: v.union(nodeDatasWithIdValidator, v.null()),
  handler: async (ctx, args) => {
    const nodeData = await ctx.db.get(args.nodeDataId);
    return nodeData ?? null;
  },
});

export const updateAbstractAndRemoveJob = internalMutation({
  args: {
    nodeDataId: v.id("nodeDatas"),
    aiAbstract: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { nodeDataId, aiAbstract }) => {
    const existing = await ctx.db.get(nodeDataId);
    if (!existing) return null;
    await ctx.db.patch(nodeDataId, { aiAbstract });

    // Clean up the scheduledJobs entry now that the job has completed
    const scheduledJob = await ctx.db
      .query("scheduledJobs")
      .withIndex("by_nodeDataId", (q) => q.eq("nodesDataId", nodeDataId))
      .first();
    if (scheduledJob) {
      await ctx.db.delete(scheduledJob._id);
    }

    return null;
  },
});
