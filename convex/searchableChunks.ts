import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireCanvasAccess } from "./lib/auth";
import { chunkTypeValidator } from "./schemas/searchableChunksSchema";

const SNIPPET_RADIUS = 90;
const MAX_SNIPPETS_PER_CHUNK = 1;
const MAX_SNIPPETS_PER_NODE = 5;
const MAX_MATCHING_CHUNKS = 50;

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
      images: v.array(
        v.object({
          imageUrl: v.string(),
          page: v.optional(v.number()),
        }),
      ),
      snippets: v.array(
        v.object({
          snippet: v.string(),
          chunkType: chunkTypeValidator,
          order: v.number(),
          page: v.optional(v.number()),
          imageUrl: v.optional(v.string()),
          matchStart: v.number(),
          matchEnd: v.number(),
        }),
      ),
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
      .take(MAX_MATCHING_CHUNKS);

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
      images: Array.from(
        new Map(
          chunks
            .map((chunk) => {
              const imageUrl = getImageUrlFromMetadata(chunk.metadata);
              if (!imageUrl) return null;
              return [
                imageUrl,
                { imageUrl, page: getPageFromMetadata(chunk.metadata) },
              ] as const;
            })
            .filter(
              (
                item,
              ): item is readonly [
                string,
                { imageUrl: string; page: number | undefined },
              ] => item !== null,
            ),
        ).values(),
      ),
      snippets: chunks
        .flatMap((chunk) =>
          buildChunkSnippets(chunk.text, args.query).map((match) => ({
            snippet: match.snippet,
            chunkType: chunk.chunkType,
            order: chunk.order,
            page: getPageFromMetadata(chunk.metadata),
            imageUrl: getImageUrlFromMetadata(chunk.metadata),
            matchStart: match.matchStart,
            matchEnd: match.matchEnd,
          })),
        )
        .slice(0, MAX_SNIPPETS_PER_NODE),
      chunks,
    }));
  },
});

function buildChunkSnippets(text: string, query: string) {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) return [];

  const terms = Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2),
    ),
  );

  if (terms.length === 0) {
    return [
      {
        snippet: ellipsize(normalizedText.slice(0, SNIPPET_RADIUS * 2)),
        matchStart: 0,
        matchEnd: Math.min(normalizedText.length, SNIPPET_RADIUS * 2),
      },
    ];
  }

  const matches: Array<{
    snippet: string;
    matchStart: number;
    matchEnd: number;
  }> = [];
  const lowerText = normalizedText.toLowerCase();

  for (const term of terms) {
    let start = 0;
    while (matches.length < MAX_SNIPPETS_PER_CHUNK) {
      const idx = lowerText.indexOf(term, start);
      if (idx === -1) break;

      const matchStart = idx;
      const matchEnd = idx + term.length;
      const snippetStart = Math.max(0, matchStart - SNIPPET_RADIUS);
      const snippetEnd = Math.min(
        normalizedText.length,
        matchEnd + SNIPPET_RADIUS,
      );
      const rawSnippet = normalizedText.slice(snippetStart, snippetEnd);

      matches.push({
        snippet: `${snippetStart > 0 ? "..." : ""}${rawSnippet}${snippetEnd < normalizedText.length ? "..." : ""}`,
        matchStart,
        matchEnd,
      });

      start = matchEnd;
    }

    if (matches.length >= MAX_SNIPPETS_PER_CHUNK) break;
  }

  if (matches.length === 0) {
    return [
      {
        snippet: ellipsize(normalizedText.slice(0, SNIPPET_RADIUS * 2)),
        matchStart: 0,
        matchEnd: Math.min(normalizedText.length, SNIPPET_RADIUS * 2),
      },
    ];
  }

  return matches;
}

function getPageFromMetadata(metadata: unknown): number | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const maybePage = (metadata as { page?: unknown }).page;
  return typeof maybePage === "number" ? maybePage : undefined;
}

function getImageUrlFromMetadata(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const maybeImageUrl = (metadata as { imageUrl?: unknown }).imageUrl;
  return typeof maybeImageUrl === "string" ? maybeImageUrl : undefined;
}

function ellipsize(text: string): string {
  return text.length > SNIPPET_RADIUS * 2
    ? `${text.slice(0, SNIPPET_RADIUS * 2)}...`
    : text;
}
