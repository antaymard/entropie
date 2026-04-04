import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { generateLlmId } from "./lib/llmId";

const llmIdRegex = /^\d{3}[a-zA-Z]\d{3}[a-zA-Z]$/;

function createUniqueLlmId(usedIds: Set<string>) {
  let id = generateLlmId();
  while (usedIds.has(id)) {
    id = generateLlmId();
  }

  usedIds.add(id);
  return id;
}

function normalizeHandle({
  handle,
  oldNodeId,
  newNodeId,
  expectedKind,
}: {
  handle: string | undefined;
  oldNodeId: string;
  newNodeId: string;
  expectedKind: "s" | "t";
}) {
  if (!handle) {
    return undefined;
  }

  if (handle.startsWith(oldNodeId)) {
    const tail = handle.slice(oldNodeId.length);
    const normalizedTail = tail.replace(/^_/, "");
    if (
      /^[st][lrbt]$/.test(normalizedTail) &&
      normalizedTail[0] === expectedKind
    ) {
      return `${newNodeId}_${normalizedTail}`;
    }

    return `${newNodeId}${tail}`;
  }

  const suffixMatch = handle.match(/_?([st][lrbt])$/);
  if (suffixMatch && suffixMatch[1][0] === expectedKind) {
    return `${newNodeId}_${suffixMatch[1]}`;
  }

  return handle;
}

export const migrateCanvasNodeAndEdgeIds = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    canvasId: v.optional(v.id("canvases")),
  },
  returns: v.object({
    dryRun: v.boolean(),
    canvasesScanned: v.number(),
    canvasesChanged: v.number(),
    canvasesUpdated: v.number(),
    nodeIdsChanged: v.number(),
    edgeIdsChanged: v.number(),
    edgesRewired: v.number(),
    handlesNormalized: v.number(),
    nodesWithParentRewired: v.number(),
  }),
  handler: async (ctx, { dryRun, canvasId }) => {
    const isDryRun = dryRun ?? true;
    let canvases;
    if (canvasId) {
      const canvas = await ctx.db.get(canvasId);
      canvases = canvas ? [canvas] : [];
    } else {
      canvases = await ctx.db.query("canvases").collect();
    }

    const existingCanvases = canvases.filter((canvas) => canvas !== null);

    let canvasesUpdated = 0;
    let canvasesChanged = 0;
    let nodeIdsChanged = 0;
    let edgeIdsChanged = 0;
    let edgesRewired = 0;
    let handlesNormalized = 0;
    let nodesWithParentRewired = 0;

    for (const canvas of existingCanvases) {
      const nodes = canvas.nodes ?? [];
      const edges = canvas.edges ?? [];

      const usedNodeIds = new Set<string>();
      const nodeIdMap = new Map<string, string>();

      for (const node of nodes) {
        const isStableLlmId =
          llmIdRegex.test(node.id) && !usedNodeIds.has(node.id);
        const nextNodeId = isStableLlmId
          ? node.id
          : createUniqueLlmId(usedNodeIds);
        nodeIdMap.set(node.id, nextNodeId);
        if (nextNodeId !== node.id) {
          nodeIdsChanged += 1;
        }
        if (isStableLlmId) {
          usedNodeIds.add(node.id);
        }
      }

      const usedEdgeIds = new Set<string>();
      const edgeIdMap = new Map<string, string>();

      for (const edge of edges) {
        const isStableLlmId =
          llmIdRegex.test(edge.id) && !usedEdgeIds.has(edge.id);
        const nextEdgeId = isStableLlmId
          ? edge.id
          : createUniqueLlmId(usedEdgeIds);
        edgeIdMap.set(edge.id, nextEdgeId);
        if (nextEdgeId !== edge.id) {
          edgeIdsChanged += 1;
        }
        if (isStableLlmId) {
          usedEdgeIds.add(edge.id);
        }
      }

      let canvasChanged = false;

      const migratedNodes = nodes.map((node) => {
        const nextNodeId = nodeIdMap.get(node.id) ?? node.id;
        const nextParentId = node.parentId
          ? (nodeIdMap.get(node.parentId) ?? node.parentId)
          : undefined;

        if (nextNodeId !== node.id || nextParentId !== node.parentId) {
          canvasChanged = true;
        }

        if (nextParentId !== node.parentId && node.parentId) {
          nodesWithParentRewired += 1;
        }

        return {
          ...node,
          id: nextNodeId,
          parentId: nextParentId,
        };
      });

      const migratedEdges = edges.map((edge) => {
        const nextEdgeId = edgeIdMap.get(edge.id) ?? edge.id;
        const nextSource = nodeIdMap.get(edge.source) ?? edge.source;
        const nextTarget = nodeIdMap.get(edge.target) ?? edge.target;
        const nextSourceHandle = normalizeHandle({
          handle: edge.sourceHandle,
          oldNodeId: edge.source,
          newNodeId: nextSource,
          expectedKind: "s",
        });
        const nextTargetHandle = normalizeHandle({
          handle: edge.targetHandle,
          oldNodeId: edge.target,
          newNodeId: nextTarget,
          expectedKind: "t",
        });

        if (
          nextEdgeId !== edge.id ||
          nextSource !== edge.source ||
          nextTarget !== edge.target
        ) {
          canvasChanged = true;
        }

        if (nextSource !== edge.source || nextTarget !== edge.target) {
          edgesRewired += 1;
        }

        if (
          nextSourceHandle !== edge.sourceHandle ||
          nextTargetHandle !== edge.targetHandle
        ) {
          handlesNormalized += 1;
          canvasChanged = true;
        }

        return {
          ...edge,
          id: nextEdgeId,
          source: nextSource,
          target: nextTarget,
          sourceHandle: nextSourceHandle,
          targetHandle: nextTargetHandle,
        };
      });

      if (canvasChanged) {
        canvasesChanged += 1;
      }

      if (!isDryRun && canvasChanged) {
        await ctx.db.patch(canvas._id, {
          nodes: migratedNodes,
          edges: migratedEdges,
          updatedAt: Date.now(),
        });
        canvasesUpdated += 1;
      }
    }

    return {
      dryRun: isDryRun,
      canvasesScanned: existingCanvases.length,
      canvasesChanged,
      canvasesUpdated,
      nodeIdsChanged,
      edgeIdsChanged,
      edgesRewired,
      handlesNormalized,
      nodesWithParentRewired,
    };
  },
});

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
        .withIndex("by_subject_and_type", (q) =>
          q.eq("subjectId", nodeDataId),
        )
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
