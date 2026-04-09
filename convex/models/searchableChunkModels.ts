import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type SearchableChunk = Doc<"searchableChunks">;

function serializeMetadata(metadata: unknown): string {
  if (metadata === undefined) return "";
  try {
    return JSON.stringify(metadata);
  } catch {
    return "";
  }
}

function chunkEquals(
  left: Omit<SearchableChunk, "_id" | "_creationTime">,
  right: Omit<SearchableChunk, "_id" | "_creationTime">,
): boolean {
  return (
    left.nodeDataId === right.nodeDataId &&
    left.nodeId === right.nodeId &&
    left.canvasId === right.canvasId &&
    left.nodeType === right.nodeType &&
    left.templateId === right.templateId &&
    left.chunkType === right.chunkType &&
    left.order === right.order &&
    left.text === right.text &&
    serializeMetadata(left.metadata) === serializeMetadata(right.metadata)
  );
}

function toComparableChunk(
  chunk: SearchableChunk,
): Omit<SearchableChunk, "_id" | "_creationTime"> {
  return {
    nodeDataId: chunk.nodeDataId,
    nodeId: chunk.nodeId,
    canvasId: chunk.canvasId,
    nodeType: chunk.nodeType,
    templateId: chunk.templateId,
    chunkType: chunk.chunkType,
    order: chunk.order,
    text: chunk.text,
    metadata: chunk.metadata,
  };
}

export async function upsertChunks(
  ctx: MutationCtx,
  {
    nodeDataId,
    chunks,
  }: {
    nodeDataId: Id<"nodeDatas">;
    chunks: Array<Omit<SearchableChunk, "_id" | "_creationTime">>;
  },
): Promise<void> {
  const existing = await ctx.db
    .query("searchableChunks")
    .withIndex("by_nodeDataId", (q) => q.eq("nodeDataId", nodeDataId))
    .collect();

  const sortedExisting = [...existing].sort((a, b) => a.order - b.order);
  const sortedIncoming = [...chunks].sort((a, b) => a.order - b.order);

  const isExactMatch =
    sortedExisting.length === sortedIncoming.length &&
    sortedExisting.every((chunk, index) =>
      chunkEquals(toComparableChunk(chunk), sortedIncoming[index]),
    );

  if (isExactMatch) {
    return;
  }

  if (sortedExisting.length === sortedIncoming.length) {
    for (let i = 0; i < sortedExisting.length; i++) {
      const existingChunk = sortedExisting[i];
      const incomingChunk = sortedIncoming[i];

      if (!chunkEquals(toComparableChunk(existingChunk), incomingChunk)) {
        await ctx.db.patch(existingChunk._id, incomingChunk);
      }
    }
    return;
  }

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

export async function updateCanvasId(
  ctx: MutationCtx,
  {
    nodeDataId,
    canvasId,
  }: { nodeDataId: Id<"nodeDatas">; canvasId: Id<"canvases"> },
): Promise<void> {
  const chunks = await ctx.db
    .query("searchableChunks")
    .withIndex("by_nodeDataId", (q) => q.eq("nodeDataId", nodeDataId))
    .collect();

  for (const chunk of chunks) {
    await ctx.db.patch(chunk._id, { canvasId });
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
