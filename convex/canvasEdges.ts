import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { edgesValidator } from "./schemas/canvasesSchema";
import errors from "./errorsConfig";

export const add = mutation({
  args: {
    canvasId: v.id("canvases"),
    edges: v.array(edgesValidator),
  },
  handler: async (ctx, { edges, canvasId }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }

    // Ajouter les edges au canvas
    await ctx.db.patch(canvasId, {
      edges: [...(canvas.edges || []), ...edges],
    });

    // Mettre à jour les dependencies des nodeDatas
    const nodes = canvas.nodes || [];

    for (const edge of edges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      const sourceNodeDataId = sourceNode?.nodeDataId;
      const targetNodeDataId = targetNode?.nodeDataId;

      if (!sourceNodeDataId || !targetNodeDataId) {
        continue; // Skip si un des nodeDataId n'existe pas
      }

      // Mettre à jour le nodeData target avec le source comme dépendance input
      const targetNodeData = await ctx.db.get(targetNodeDataId);
      if (targetNodeData) {
        const existingDeps = targetNodeData.dependencies || [];
        const alreadyExists = existingDeps.some(
          (dep) => dep.nodeDataId === sourceNodeDataId && dep.type === "input",
        );
        if (!alreadyExists) {
          await ctx.db.patch(targetNodeDataId, {
            dependencies: [
              ...existingDeps,
              { nodeDataId: sourceNodeDataId, type: "input" as const },
            ],
            updatedAt: Date.now(),
          });
        }
      }

      // Mettre à jour le nodeData source avec le target comme dépendance output
      const sourceNodeData = await ctx.db.get(sourceNodeDataId);
      if (sourceNodeData) {
        const existingDeps = sourceNodeData.dependencies || [];
        const alreadyExists = existingDeps.some(
          (dep) => dep.nodeDataId === targetNodeDataId && dep.type === "output",
        );
        if (!alreadyExists) {
          await ctx.db.patch(sourceNodeDataId, {
            dependencies: [
              ...existingDeps,
              { nodeDataId: targetNodeDataId, type: "output" as const },
            ],
            updatedAt: Date.now(),
          });
        }
      }
    }

    console.log(`✅ Added ${edges.length} edges to canvas ${canvasId}`);
    return true;
  },
});

export const update = mutation({
  args: {
    canvasId: v.id("canvases"),
    edgeUpdates: v.array(
      v.object({
        id: v.string(),
        data: v.optional(v.record(v.string(), v.any())),
      }),
    ),
  },
  handler: async (ctx, { canvasId, edgeUpdates }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }

    const edges = canvas.edges || [];

    const updatedEdges = edges.map((edge) => {
      const update = edgeUpdates.find((u) => u.id === edge.id);
      if (!update) return edge;

      return {
        ...edge,
        data: update.data ? { ...edge.data, ...update.data } : edge.data,
      };
    });

    await ctx.db.patch(canvasId, { edges: updatedEdges });
    console.log(`✅ Updated ${edgeUpdates.length} edges in canvas ${canvasId}`);
    return true;
  },
});

export const remove = mutation({
  args: {
    canvasId: v.id("canvases"),
    edgeIds: v.array(v.string()),
  },
  handler: async (ctx, { canvasId, edgeIds }) => {
    const authUserId = await requireAuth(ctx);

    const canvas = await ctx.db.get(canvasId);
    if (!canvas) {
      throw new ConvexError(errors.CANVAS_NOT_FOUND);
    }
    if (canvas.creatorId !== authUserId) {
      throw new ConvexError(errors.UNAUTHORIZED_USER);
    }

    const nodes = canvas.nodes || [];
    const edges = canvas.edges || [];

    // Trouver les edges à supprimer pour retirer les dependencies
    const edgesToRemove = edges.filter((edge) => edgeIds.includes(edge.id));

    for (const edge of edgesToRemove) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      const sourceNodeDataId = sourceNode?.nodeDataId;
      const targetNodeDataId = targetNode?.nodeDataId;

      if (!sourceNodeDataId || !targetNodeDataId) {
        continue;
      }

      // Retirer la dépendance input du target
      const targetNodeData = await ctx.db.get(targetNodeDataId);
      if (targetNodeData) {
        const filteredDeps = (targetNodeData.dependencies || []).filter(
          (dep) =>
            !(dep.nodeDataId === sourceNodeDataId && dep.type === "input"),
        );
        await ctx.db.patch(targetNodeDataId, {
          dependencies: filteredDeps,
          updatedAt: Date.now(),
        });
      }

      // Retirer la dépendance output du source
      const sourceNodeData = await ctx.db.get(sourceNodeDataId);
      if (sourceNodeData) {
        const filteredDeps = (sourceNodeData.dependencies || []).filter(
          (dep) =>
            !(dep.nodeDataId === targetNodeDataId && dep.type === "output"),
        );
        await ctx.db.patch(sourceNodeDataId, {
          dependencies: filteredDeps,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(canvasId, {
      edges: edges.filter((edge) => !edgeIds.includes(edge.id)),
    });

    console.log(`✅ Removed ${edgeIds.length} edges from canvas ${canvasId}`);
    return true;
  },
});
