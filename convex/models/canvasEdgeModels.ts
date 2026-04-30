import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import errors from "../config/errorsConfig";

type CanvasEdge = NonNullable<Doc<"canvases">["edges"]>[number];

type EdgeUpdate = {
  id: string;
  data?: Record<string, unknown>;
};

async function getCanvas(
  ctx: MutationCtx,
  canvasId: Doc<"canvases">["_id"],
): Promise<Doc<"canvases">> {
  const canvas = await ctx.db.get("canvases", canvasId);
  if (!canvas) {
    throw new ConvexError(errors.CANVAS_NOT_FOUND);
  }
  return canvas;
}

async function syncDependenciesForAddedEdges(
  ctx: MutationCtx,
  canvas: Doc<"canvases">,
  edges: Array<CanvasEdge>,
): Promise<void> {
  const nodes = canvas.nodes ?? [];

  for (const edge of edges) {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    const sourceNodeDataId = sourceNode?.nodeDataId;
    const targetNodeDataId = targetNode?.nodeDataId;

    if (!sourceNodeDataId || !targetNodeDataId) {
      continue;
    }

    const targetNodeData = await ctx.db.get("nodeDatas", targetNodeDataId);
    if (targetNodeData) {
      const existingDeps = targetNodeData.dependencies ?? [];
      const alreadyExists = existingDeps.some(
        (dep) => dep.nodeDataId === sourceNodeDataId && dep.type === "input",
      );

      if (!alreadyExists) {
        await ctx.db.patch("nodeDatas", targetNodeDataId, {
          dependencies: [
            ...existingDeps,
            { nodeDataId: sourceNodeDataId, type: "input" as const },
          ],
          updatedAt: Date.now(),
        });
      }
    }

    const sourceNodeData = await ctx.db.get("nodeDatas", sourceNodeDataId);
    if (sourceNodeData) {
      const existingDeps = sourceNodeData.dependencies ?? [];
      const alreadyExists = existingDeps.some(
        (dep) => dep.nodeDataId === targetNodeDataId && dep.type === "output",
      );

      if (!alreadyExists) {
        await ctx.db.patch("nodeDatas", sourceNodeDataId, {
          dependencies: [
            ...existingDeps,
            { nodeDataId: targetNodeDataId, type: "output" as const },
          ],
          updatedAt: Date.now(),
        });
      }
    }
  }
}

async function syncDependenciesForRemovedEdges(
  ctx: MutationCtx,
  canvas: Doc<"canvases">,
  edgeIds: Array<string>,
): Promise<void> {
  const nodes = canvas.nodes ?? [];
  const edges = canvas.edges ?? [];
  const edgesToRemove = edges.filter((edge) => edgeIds.includes(edge.id));

  for (const edge of edgesToRemove) {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    const sourceNodeDataId = sourceNode?.nodeDataId;
    const targetNodeDataId = targetNode?.nodeDataId;

    if (!sourceNodeDataId || !targetNodeDataId) {
      continue;
    }

    const targetNodeData = await ctx.db.get("nodeDatas", targetNodeDataId);
    if (targetNodeData) {
      const filteredDeps = (targetNodeData.dependencies ?? []).filter(
        (dep) => !(dep.nodeDataId === sourceNodeDataId && dep.type === "input"),
      );
      await ctx.db.patch("nodeDatas", targetNodeDataId, {
        dependencies: filteredDeps,
        updatedAt: Date.now(),
      });
    }

    const sourceNodeData = await ctx.db.get("nodeDatas", sourceNodeDataId);
    if (sourceNodeData) {
      const filteredDeps = (sourceNodeData.dependencies ?? []).filter(
        (dep) =>
          !(dep.nodeDataId === targetNodeDataId && dep.type === "output"),
      );
      await ctx.db.patch("nodeDatas", sourceNodeDataId, {
        dependencies: filteredDeps,
        updatedAt: Date.now(),
      });
    }
  }
}

const DEFAULT_MARKER_END = {
  type: "arrow",
  width: 30,
  height: 30,
  strokeWidth: 1,
};

export async function addCanvasEdges(
  ctx: MutationCtx,
  {
    canvasId,
    edges,
  }: {
    canvasId: Doc<"canvases">["_id"];
    edges: Array<CanvasEdge>;
  },
): Promise<boolean> {
  const canvas = await getCanvas(ctx, canvasId);

  const edgesWithDefaults = edges.map((edge) => ({
    ...edge,
    markerEnd: edge.markerEnd ?? DEFAULT_MARKER_END,
  }));

  await ctx.db.patch("canvases", canvasId, {
    edges: [...(canvas.edges ?? []), ...edgesWithDefaults],
    updatedAt: Date.now(),
  });

  await syncDependenciesForAddedEdges(ctx, canvas, edgesWithDefaults);

  console.log(`✅ Added ${edges.length} edges to canvas ${canvasId}`);
  return true;
}

export async function updateCanvasEdges(
  ctx: MutationCtx,
  {
    canvasId,
    edgeUpdates,
  }: {
    canvasId: Doc<"canvases">["_id"];
    edgeUpdates: Array<EdgeUpdate>;
  },
): Promise<boolean> {
  const canvas = await getCanvas(ctx, canvasId);
  const edges = canvas.edges ?? [];

  const updatedEdges = edges.map((edge) => {
    const update = edgeUpdates.find((item) => item.id === edge.id);
    if (!update) {
      return edge;
    }

    if (update.data === undefined) {
      return edge;
    }

    return {
      ...edge,
      data: update.data,
    };
  });

  await ctx.db.patch("canvases", canvasId, {
    edges: updatedEdges,
    updatedAt: Date.now(),
  });

  console.log(`✅ Updated ${edgeUpdates.length} edges in canvas ${canvasId}`);
  return true;
}

export async function removeCanvasEdges(
  ctx: MutationCtx,
  {
    canvasId,
    edgeIds,
  }: {
    canvasId: Doc<"canvases">["_id"];
    edgeIds: Array<string>;
  },
): Promise<boolean> {
  const canvas = await getCanvas(ctx, canvasId);

  await syncDependenciesForRemovedEdges(ctx, canvas, edgeIds);

  await ctx.db.patch("canvases", canvasId, {
    edges: (canvas.edges ?? []).filter((edge) => !edgeIds.includes(edge.id)),
    updatedAt: Date.now(),
  });

  console.log(`✅ Removed ${edgeIds.length} edges from canvas ${canvasId}`);
  return true;
}
