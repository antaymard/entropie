import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireCanvasAccess } from "./lib/auth";

export const search = query({
  args: {
    query: v.string(),
    canvasId: v.id("canvases"),
  },
  returns: v.array(
    v.object({
      type: v.string(),
      nodeId: v.string(),
      nodeDataId: v.id("nodeDatas"),
      chunks: v.array(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    const authUserId = await requireAuth(ctx);

    // Vérifier l'accès au canvas
    await requireCanvasAccess(ctx, args.canvasId, authUserId); // viewer required

    // Rechercher les chunks correspondants
    const results = await ctx.db
      .query("searchableChunks")
      .withSearchIndex("search_text", (q) =>
        q.search("text", args.query).eq("canvasId", args.canvasId),
      )
      .take(10);

    const groupedByNodeId = new Map<string, typeof results>();
    for (const chunk of results) {
      const existing = groupedByNodeId.get(chunk.nodeId);
      if (existing) {
        existing.push(chunk);
      } else {
        groupedByNodeId.set(chunk.nodeId, [chunk]);
      }
    }

    return Array.from(groupedByNodeId.entries()).map(([nodeId, chunks]) => ({
      type: chunks[0].nodeType,
      nodeId,
      nodeDataId: chunks[0].nodeDataId,
      chunks,
    }));
  },
});
