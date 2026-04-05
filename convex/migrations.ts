import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Migration: backfill canvasId on nodeDatas and metadatas
// ---------------------------------------------------------------------------
// Iterates all canvases, reads their nodes[], and patches each referenced
// nodeData + its metadatas with the canvas _id.
//
// If a nodeDataId is referenced by multiple canvases (legacy synced
// duplicates), it is assigned to the first canvas encountered and logged
// as a conflict. Those should be resolved manually or via a separate
// deduplication step.
//
// Usage:
//   npx convex run migrations:backfillCanvasId               # dry run (default)
//   npx convex run migrations:backfillCanvasId '{"dryRun": false}'  # real run
// ---------------------------------------------------------------------------

export const backfillCanvasId = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    dryRun: v.boolean(),
    canvasesScanned: v.number(),
    nodeDataPatched: v.number(),
    metadataPatched: v.number(),
    nodeDataAlreadySet: v.number(),
    conflicts: v.array(
      v.object({
        nodeDataId: v.string(),
        assignedCanvasId: v.string(),
        conflictingCanvasId: v.string(),
      }),
    ),
    orphanedNodeDataIds: v.array(v.string()),
  }),
  handler: async (ctx, { dryRun }) => {
    const isDryRun = dryRun ?? true;

    const canvases = await ctx.db.query("canvases").collect();

    // Map each nodeDataId → first canvasId that references it
    const nodeDataToCanvas = new Map<Id<"nodeDatas">, Id<"canvases">>();
    const conflicts: Array<{
      nodeDataId: string;
      assignedCanvasId: string;
      conflictingCanvasId: string;
    }> = [];

    for (const canvas of canvases) {
      for (const node of canvas.nodes ?? []) {
        if (!node.nodeDataId) continue;

        const existing = nodeDataToCanvas.get(node.nodeDataId);
        if (existing && existing !== canvas._id) {
          conflicts.push({
            nodeDataId: node.nodeDataId,
            assignedCanvasId: existing,
            conflictingCanvasId: canvas._id,
          });
          continue;
        }

        nodeDataToCanvas.set(node.nodeDataId, canvas._id);
      }
    }

    let nodeDataPatched = 0;
    let metadataPatched = 0;
    let nodeDataAlreadySet = 0;
    const orphanedNodeDataIds: string[] = [];

    for (const [nodeDataId, canvasId] of nodeDataToCanvas) {
      const nodeData = await ctx.db.get(nodeDataId);
      if (!nodeData) {
        orphanedNodeDataIds.push(nodeDataId);
        continue;
      }

      // Skip if already set correctly
      if (nodeData.canvasId === canvasId) {
        nodeDataAlreadySet++;
        // Still check metadatas for this nodeData
      } else {
        if (!isDryRun) {
          await ctx.db.patch(nodeDataId, { canvasId });
        }
        nodeDataPatched++;
      }

      // Patch associated metadatas
      const metadatas = await ctx.db
        .query("metadatas")
        .withIndex("by_subject_and_type", (q) => q.eq("subjectId", nodeDataId))
        .collect();

      for (const metadata of metadatas) {
        if (metadata.canvasId === canvasId) continue;
        if (!isDryRun) {
          await ctx.db.patch(metadata._id, { canvasId });
        }
        metadataPatched++;
      }
    }

    const result = {
      dryRun: isDryRun,
      canvasesScanned: canvases.length,
      nodeDataPatched,
      metadataPatched,
      nodeDataAlreadySet,
      conflicts,
      orphanedNodeDataIds,
    };

    console.log("📊 backfillCanvasId result:", JSON.stringify(result, null, 2));

    return result;
  },
});
