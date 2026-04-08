import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type SearchableChunk = Doc<"searchableChunks">;

export async function upsertChunks(
  ctx: MutationCtx,
  {
    nodeDataId,
    fieldPath,
    chunks,
  }: {
    nodeDataId: Id<"nodeDatas">;
    fieldPath: string;
    chunks: Array<Omit<SearchableChunk, "_id" | "_creationTime">>;
  },
): Promise<void> {
  // Delete existing chunks for this (nodeDataId, fieldPath) pair
  const existing = await ctx.db
    .query("searchableChunks")
    .withIndex("by_nodeDataId_and_fieldPath", (q) =>
      q.eq("nodeDataId", nodeDataId).eq("fieldPath", fieldPath),
    )
    .collect();

  for (const chunk of existing) {
    await ctx.db.delete(chunk._id);
  }

  for (const chunk of chunks) {
    await ctx.db.insert("searchableChunks", chunk);
  }
}

export async function deleteByNodeDataId(
  ctx: MutationCtx,
  { nodeDataId }: { nodeDataId: Id<"nodeDatas"> },
): Promise<void> {
  const chunks = await ctx.db
    .query("searchableChunks")
    .withIndex("by_nodeDataId", (q) => q.eq("nodeDataId", nodeDataId))
    .collect();

  for (const chunk of chunks) {
    await ctx.db.delete(chunk._id);
  }
}

export async function deleteByCanvasId(
  ctx: MutationCtx,
  { canvasId }: { canvasId: Id<"canvases"> },
): Promise<void> {
  const chunks = await ctx.db
    .query("searchableChunks")
    .withIndex("by_canvasId", (q) => q.eq("canvasId", canvasId))
    .collect();

  for (const chunk of chunks) {
    await ctx.db.delete(chunk._id);
  }
}

export async function listByNodeDataId(
  ctx: QueryCtx,
  { nodeDataId }: { nodeDataId: Id<"nodeDatas"> },
): Promise<SearchableChunk[]> {
  return await ctx.db
    .query("searchableChunks")
    .withIndex("by_nodeDataId", (q) => q.eq("nodeDataId", nodeDataId))
    .collect();
}
