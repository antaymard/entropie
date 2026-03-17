import { ConvexError } from "convex/values";
import type { FunctionReference } from "convex/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

const ABSTRACT_DEBOUNCE_MS = 5 * 60 * 1000;

type AbstractNodeDataRef = FunctionReference<
  "action",
  "public" | "internal",
  { nodeDataId: Id<"nodeDatas"> },
  unknown
>;

export async function readNodeData(
  ctx: QueryCtx,
  { _id }: { _id: Id<"nodeDatas"> },
): Promise<Doc<"nodeDatas">> {
  const nodeData = await ctx.db.get("nodeDatas", _id);
  if (!nodeData) throw new ConvexError("NodeData non trouvé");
  return nodeData;
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

export async function updateValues(
  ctx: MutationCtx,
  {
    _id,
    values,
  }: {
    _id: Id<"nodeDatas">;
    values: Record<string, unknown>;
  },
  abstractNodeDataRef: AbstractNodeDataRef,
): Promise<boolean> {
  const existing = await ctx.db.get("nodeDatas", _id);
  if (!existing) throw new ConvexError("NodeData non trouvé");

  const now = Date.now();
  await ctx.db.patch("nodeDatas", _id, {
    values: { ...existing.values, ...values },
    updatedAt: now,
  });

  const existingJob = await ctx.db
    .query("scheduledJobs")
    .withIndex("by_nodeDataId", (q) => q.eq("nodesDataId", _id))
    .first();

  if (existingJob) {
    const job = await ctx.db.system.get(existingJob.jobId);
    if (job && job.state.kind === "pending") {
      await ctx.scheduler.cancel(existingJob.jobId);
    }
    await ctx.db.delete("scheduledJobs", existingJob._id);
  }

  const scheduledId = await ctx.scheduler.runAfter(
    ABSTRACT_DEBOUNCE_MS,
    abstractNodeDataRef,
    { nodeDataId: _id },
  );

  await ctx.db.insert("scheduledJobs", {
    type: "generate-node-data-abstract",
    nodesDataId: _id,
    scheduledAt: now + ABSTRACT_DEBOUNCE_MS,
    jobId: scheduledId,
  });

  return true;
}
