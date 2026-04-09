import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type SearchableChunk = Doc<"searchableChunks">;

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
  // Keep implementation simple and predictable: replace all chunks for this node.
  const existing = await ctx.db
    .query("searchableChunks")
    .withIndex("by_nodeDataId", (q) => q.eq("nodeDataId", nodeDataId))
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

type FullTextSearchHit = {
  nodeId: string;
  nodeDataId: Id<"nodeDatas">;
  nodeType: SearchableChunk["nodeType"];
  chunkType: SearchableChunk["chunkType"];
  order: number;
  text: string;
  page?: number;
  sectionTitle?: string;
};

type FullTextSearchResult = {
  hits: FullTextSearchHit[];
  scanned: number;
  limit: number;
  truncated: boolean;
};

// Search defaults are intentionally conservative to keep tool calls predictable.
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 250;
const MAX_SCAN_CAP = 250;
const SCAN_MULTIPLIER = 5;

// Clamp user-provided limit into a safe, bounded integer.
function clampLimit(limit: number | undefined): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
}

// Metadata is dynamic; extract page only when present and well-typed.
function getPage(metadata: unknown): number | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const page = (metadata as { page?: unknown }).page;
  return typeof page === "number" ? page : undefined;
}

// For PDF chunks, keep only the first section title as a compact locator.
function getSectionTitle(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const sections = (metadata as { sections?: unknown }).sections;
  if (!Array.isArray(sections) || sections.length === 0) return undefined;

  const firstSection = sections[0];
  if (!firstSection || typeof firstSection !== "object") return undefined;

  const title = (firstSection as { title?: unknown }).title;
  if (typeof title !== "string") return undefined;

  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function fullTextSearch(
  ctx: QueryCtx,
  {
    canvasId,
    query,
    nodeIds,
    limit,
  }: {
    canvasId: Id<"canvases">;
    query: string;
    nodeIds?: string[];
    limit?: number;
  },
): Promise<FullTextSearchResult> {
  // 1) Resolve effective limits for response and scan window.
  const effectiveLimit = clampLimit(limit);

  // Read more than we return so post-filtering (nodeIds) still has good recall.
  const scanLimit = Math.min(effectiveLimit * SCAN_MULTIPLIER, MAX_SCAN_CAP);

  // 2) Run indexed full-text search scoped to the canvas.
  const chunks = await ctx.db
    .query("searchableChunks")
    .withSearchIndex("search_text", (q) =>
      q.search("text", query).eq("canvasId", canvasId),
    )
    .take(scanLimit);

  // 3) Apply optional node-level filtering.
  const nodeIdFilter =
    nodeIds && nodeIds.length > 0 ? new Set(nodeIds) : undefined;

  const filtered = nodeIdFilter
    ? chunks.filter((chunk) => nodeIdFilter.has(chunk.nodeId))
    : chunks;

  // 4) Truncate for payload size, then project to the compact response shape.
  const selected = filtered.slice(0, effectiveLimit);

  // If we had more filtered hits than returned OR we hit scan cap, signal truncation.
  const truncated =
    filtered.length > effectiveLimit || chunks.length === scanLimit;

  return {
    hits: selected.map((chunk) => ({
      nodeId: chunk.nodeId,
      nodeDataId: chunk.nodeDataId,
      nodeType: chunk.nodeType,
      chunkType: chunk.chunkType,
      order: chunk.order,
      text: chunk.text,
      page: getPage(chunk.metadata),
      sectionTitle: getSectionTitle(chunk.metadata),
    })),
    scanned: chunks.length,
    limit: effectiveLimit,
    truncated,
  };
}
