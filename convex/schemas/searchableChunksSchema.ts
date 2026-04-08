import { v } from "convex/values";
import { nodeTypeValidator } from "./nodeTypeSchema";

// ── Sub-validators ──────────────────────────────────────────────────────

const chunkTypeValidator = v.union(
  v.literal("field"),
  v.literal("page"),
  v.literal("section"),
  v.literal("image"),
);

// ── Main validator ──────────────────────────────────────────────────────

const searchableChunksValidator = v.object({
  nodeId: v.string(),
  nodeDataId: v.id("nodeDatas"),
  canvasId: v.id("canvases"),
  fieldPath: v.string(),
  fieldType: v.string(),
  chunkType: chunkTypeValidator,
  nodeType: nodeTypeValidator,
  templateId: v.optional(v.string()),
  text: v.string(),
  order: v.number(),
  metadata: v.optional(v.record(v.string(), v.any())),
});

export { searchableChunksValidator, chunkTypeValidator };
