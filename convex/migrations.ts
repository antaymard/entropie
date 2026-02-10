import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Migration: Clean orphaned nodeDatas not referenced by any canvas node
 * Run once with: npx convex run migrations:cleanOrphanedNodeDatas
 */
export const cleanOrphanedNodeDatas = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Collect all nodeDataIds referenced across all canvases
    const allCanvases = await ctx.db.query("canvases").collect();
    const referencedIds = new Set<Id<"nodeDatas">>();

    for (const canvas of allCanvases) {
      for (const node of canvas.nodes || []) {
        if (node.nodeDataId) {
          referencedIds.add(node.nodeDataId as Id<"nodeDatas">);
        }
      }
    }

    // 2. Scan all nodeDatas and delete those not referenced
    const allNodeDatas = await ctx.db.query("nodeDatas").collect();
    let deleted = 0;

    for (const nodeData of allNodeDatas) {
      if (!referencedIds.has(nodeData._id)) {
        await ctx.db.delete(nodeData._id);
        deleted++;
      }
    }

    console.log(
      `🧹 Cleaned ${deleted} orphaned nodeDatas out of ${allNodeDatas.length} total`,
    );
    return {
      total: allNodeDatas.length,
      deleted,
      kept: allNodeDatas.length - deleted,
    };
  },
});
