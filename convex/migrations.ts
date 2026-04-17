import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Migration: replace every canvas node type "file" with "pdf"
 * and update linked nodeDatas from "file" to "pdf".
 */
export const migrateFileNodesToPdf = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    dryRun: v.boolean(),
    canvasesScanned: v.number(),
    canvasesUpdated: v.number(),
    canvasNodesUpdated: v.number(),
    linkedNodeDatasFound: v.number(),
    nodeDatasUpdated: v.number(),
    nodeDatasMissing: v.number(),
    searchableChunksScanned: v.number(),
    searchableChunksUpdated: v.number(),
  }),
  handler: async (ctx, { dryRun = true }) => {
    const canvases = await ctx.db.query("canvases").collect();
    const searchableChunks = await ctx.db.query("searchableChunks").collect();

    let canvasesUpdated = 0;
    let canvasNodesUpdated = 0;
    let nodeDatasUpdated = 0;
    let nodeDatasMissing = 0;
    let searchableChunksUpdated = 0;

    const linkedNodeDataIds = new Set<Id<"nodeDatas">>();

    for (const canvas of canvases) {
      const nodes = canvas.nodes ?? [];
      let canvasChanged = false;

      const updatedNodes = nodes.map((node) => {
        if (node.type !== "file") return node;

        canvasChanged = true;
        canvasNodesUpdated += 1;

        if (node.nodeDataId) {
          linkedNodeDataIds.add(node.nodeDataId);
        }

        return {
          ...node,
          type: "pdf" as const,
        };
      });

      if (!canvasChanged) continue;

      canvasesUpdated += 1;
      if (!dryRun) {
        await ctx.db.patch("canvases", canvas._id, {
          nodes: updatedNodes,
          updatedAt: Date.now(),
        });
      }
    }

    for (const nodeDataId of linkedNodeDataIds) {
      const nodeData = await ctx.db.get("nodeDatas", nodeDataId);
      if (!nodeData) {
        nodeDatasMissing += 1;
        continue;
      }

      if (nodeData.type !== "file") continue;

      nodeDatasUpdated += 1;
      if (!dryRun) {
        await ctx.db.patch("nodeDatas", nodeData._id, {
          type: "pdf",
          updatedAt: Date.now(),
        });
      }
    }

    for (const chunk of searchableChunks) {
      if (chunk.nodeType !== "file") continue;

      searchableChunksUpdated += 1;
      if (!dryRun) {
        await ctx.db.patch("searchableChunks", chunk._id, {
          nodeType: "pdf",
        });
      }
    }

    return {
      dryRun,
      canvasesScanned: canvases.length,
      canvasesUpdated,
      canvasNodesUpdated,
      linkedNodeDatasFound: linkedNodeDataIds.size,
      nodeDatasUpdated,
      nodeDatasMissing,
      searchableChunksScanned: searchableChunks.length,
      searchableChunksUpdated,
    };
  },
});

/**
 * Migration: replace every canvas node type "floatingText" or "text" with "title"
 * and update nodeDatas and searchableChunks to "title".
 */
export const migrateFloatingTextNodesToTitle = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    dryRun: v.boolean(),
    canvasesScanned: v.number(),
    canvasesUpdated: v.number(),
    canvasNodesUpdated: v.number(),
    nodeDatasScanned: v.number(),
    nodeDatasUpdated: v.number(),
    searchableChunksScanned: v.number(),
    searchableChunksUpdated: v.number(),
  }),
  handler: async (ctx, { dryRun = true }) => {
    const canvases = await ctx.db.query("canvases").collect();
    const nodeDatas = await ctx.db.query("nodeDatas").collect();
    const searchableChunks = await ctx.db.query("searchableChunks").collect();

    let canvasesUpdated = 0;
    let canvasNodesUpdated = 0;
    let nodeDatasUpdated = 0;
    let searchableChunksUpdated = 0;

    for (const canvas of canvases) {
      const nodes = canvas.nodes ?? [];
      let canvasChanged = false;

      const updatedNodes = nodes.map((node) => {
        const currentType = node.type as string;
        if (currentType !== "floatingText" && currentType !== "text") {
          return node;
        }

        canvasChanged = true;
        canvasNodesUpdated += 1;

        return {
          ...node,
          type: "title" as const,
        };
      });

      if (!canvasChanged) continue;

      canvasesUpdated += 1;
      if (!dryRun) {
        await ctx.db.patch("canvases", canvas._id, {
          nodes: updatedNodes,
          updatedAt: Date.now(),
        });
      }
    }

    for (const nodeData of nodeDatas) {
      const currentType = nodeData.type as string;
      if (currentType !== "floatingText" && currentType !== "text") {
        continue;
      }

      nodeDatasUpdated += 1;
      if (!dryRun) {
        await ctx.db.patch("nodeDatas", nodeData._id, {
          type: "title",
          updatedAt: Date.now(),
        });
      }
    }

    for (const chunk of searchableChunks) {
      const currentType = chunk.nodeType as string;
      if (currentType !== "floatingText" && currentType !== "text") {
        continue;
      }

      searchableChunksUpdated += 1;
      if (!dryRun) {
        await ctx.db.patch("searchableChunks", chunk._id, {
          nodeType: "title",
        });
      }
    }

    return {
      dryRun,
      canvasesScanned: canvases.length,
      canvasesUpdated,
      canvasNodesUpdated,
      nodeDatasScanned: nodeDatas.length,
      nodeDatasUpdated,
      searchableChunksScanned: searchableChunks.length,
      searchableChunksUpdated,
    };
  },
});
