import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import * as SearchableChunkModels from "./searchableChunkModels";

export async function readNodeData(
  ctx: QueryCtx,
  { _id }: { _id: Id<"nodeDatas"> },
): Promise<Doc<"nodeDatas">> {
  const nodeData = await ctx.db.get("nodeDatas", _id);
  if (!nodeData) throw new ConvexError("NodeData non trouvé");
  return nodeData;
}

export async function createNodeData(
  ctx: MutationCtx,
  {
    type,
    values,
    canvasId,
  }: {
    type: Doc<"nodeDatas">["type"];
    values: Record<string, unknown>;
    canvasId: Id<"canvases">;
  },
): Promise<Id<"nodeDatas">> {
  return ctx.db.insert("nodeDatas", {
    type,
    values,
    canvasId,
    updatedAt: Date.now(),
  });
}

export async function listNodeDataDependencies(
  ctx: QueryCtx,
  {
    type,
    nodeDataId,
  }: {
    type: "input" | "output" | "both";
    nodeDataId: Id<"nodeDatas">;
  },
): Promise<Array<Doc<"nodeDatas">>> {
  const nodeData = await ctx.db.get("nodeDatas", nodeDataId);
  if (!nodeData) throw new ConvexError("NodeData non trouvé");
  if (!nodeData.dependencies || nodeData.dependencies.length === 0) return [];

  const filteredDependencies = nodeData.dependencies.filter((dep) => {
    if (type === "both") return true;
    return dep.type === type;
  });

  const detailedDependencies = await Promise.all(
    filteredDependencies.map(async (dep) => {
      const dependencyNodeData = await ctx.db.get("nodeDatas", dep.nodeDataId);
      if (!dependencyNodeData)
        throw new ConvexError("NodeData dépendant non trouvé");
      return dependencyNodeData;
    }),
  );

  return detailedDependencies;
}

export async function updateStatus(
  ctx: MutationCtx,
  {
    _id,
    status,
  }: {
    _id: Id<"nodeDatas">;
    status?: "idle" | "working" | "error";
  },
): Promise<boolean> {
  const existing = await ctx.db.get("nodeDatas", _id);
  if (!existing) throw new ConvexError("NodeData non trouvé");

  await ctx.db.patch("nodeDatas", _id, {
    status,
  });
  return true;
}

export async function updateAutomationProgress(
  ctx: MutationCtx,
  {
    _id,
    automationProgress,
  }: {
    _id: Id<"nodeDatas">;
    automationProgress?:
      | {
          currentStepType?: string;
          currentStepData?: Record<string, unknown>;
          currentStepStartedAt?: number;
          workStartedAt?: number;
        }
      | undefined;
  },
): Promise<boolean> {
  const existing = await ctx.db.get("nodeDatas", _id);
  if (!existing) throw new ConvexError("NodeData non trouvé");

  await ctx.db.patch("nodeDatas", _id, {
    automationProgress: automationProgress
      ? { ...existing.automationProgress, ...automationProgress }
      : automationProgress,
  });
  return true;
}

export async function deleteNodeDataWithCascade(
  ctx: MutationCtx,
  { nodeDataId }: { nodeDataId: Id<"nodeDatas"> },
): Promise<void> {
  // Delete memories
  const memories = await ctx.db
    .query("memories")
    .withIndex("by_subject_and_type", (q) => q.eq("subjectId", nodeDataId))
    .collect();
  for (const memory of memories) {
    await ctx.db.delete(memory._id);
  }

  // Delete searchable chunks
  await SearchableChunkModels.deleteByNodeDataId(ctx, { nodeDataId });

  // Delete the nodeData itself
  await ctx.db.delete(nodeDataId);
}

export async function updateValues(
  ctx: MutationCtx,
  {
    _id,
    values,
  }: {
    _id: Id<"nodeDatas">;
    values: Record<string, unknown>;
  },
): Promise<boolean> {
  console.log(`🔄 Updating values for nodeData ${_id}`);
  const existing = await ctx.db.get("nodeDatas", _id);
  if (!existing) throw new ConvexError("NodeData non trouvé");

  const now = Date.now();
  await ctx.db.patch("nodeDatas", _id, {
    values: { ...existing.values, ...values },
    updatedAt: now,
  });

  await ctx.scheduler.runAfter(0, internal.searchable.chunkBuilder.rebuildChunks, {
    nodeDataId: _id,
    updatedKeys: Object.keys(values),
  });

  return true;
}
