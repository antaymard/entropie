import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";

export const getCanvasNodeDatasWithOneLiners = internalQuery({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    console.log(
      "🚧 Fetching canvas node datas with one-liners for canvasId:",
      canvasId,
    );
    const canvas = await ctx.db.get(canvasId);
    if (!canvas) return null;

    const nodes = await Promise.all(
      (canvas.nodes || []).map(async (node) => {
        let oneLiner: string | null = null;
        const nodeDataId = node.nodeDataId ?? null;
        if (nodeDataId) {
          const memory = await ctx.db
            .query("metadatas")
            .withIndex("by_subject_and_type", (q) =>
              q.eq("subjectId", nodeDataId).eq("type", "one-liner"),
            )
            .unique();
          oneLiner = memory?.content ?? null;
        }
        return {
          idOnCanvas: node.id,
          type: node.type,
          position: node.position,
          nodeDataId,
          oneLiner,
        };
      }),
    );

    const edges = (canvas.edges || []).map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    return {
      canvasId: canvas._id,
      name: canvas.name ?? "Untitled",
      nodeCount: canvas.nodes?.length ?? 0,
      nodes,
      edges,
    };
  },
});
