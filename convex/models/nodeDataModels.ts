import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { nodeDataConfig } from "../config/nodeConfig";
import { stringifyPlateDocumentForStorage } from "../lib/plateDocumentStorage";

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

  // Stringify PlateJS documents avant stockage (limite nesting Convex à 16).
  // Les outils IA envoient déjà des strings — Array.isArray évite le double-stringify.
  const storedValues =
    existing.type === "document" && Array.isArray(values.doc)
      ? { ...values, doc: stringifyPlateDocumentForStorage(values.doc) }
      : values;

  const now = Date.now();
  await ctx.db.patch("nodeDatas", _id, {
    values: { ...existing.values, ...storedValues },
    updatedAt: now,
  });

  return true;
}

// Transcribe trigger logic. Only triggers for specific node types, and only when specific fields are updated (ex: for a pdf, only trigger when the "url" field is updated, not when we update the "title" field)
const transcriptFieldKeyByType: Partial<
  Record<Doc<"nodeDatas">["type"], string>
> = Object.fromEntries(
  nodeDataConfig.flatMap((config) =>
    config.shouldTriggerTranscribeFields === undefined
      ? []
      : [[config.type, config.shouldTriggerTranscribeFields]],
  ),
) as Partial<Record<Doc<"nodeDatas">["type"], string>>;

export function shouldTranscribe(
  type: Doc<"nodeDatas">["type"],
  updateKeys: string[],
): boolean {
  const trigger = transcriptFieldKeyByType[type];
  return trigger !== undefined && updateKeys.includes(trigger);
}
