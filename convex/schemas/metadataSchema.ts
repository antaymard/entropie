import { v } from "convex/values";

// ── Sub-validators ──────────────────────────────────────────────────────

const subjectTypeValidator = v.union(
  v.literal("nodeData"),
  v.literal("canvas"),
  v.literal("user"),
);

const memoryTypeValidator = v.union(
  v.literal("one-liner"),
  v.literal("insight"),
  v.literal("preference"),
  v.literal("relationship"),
);

const subjectIdValidator = v.union(
  v.id("nodeDatas"),
  v.id("canvases"),
  v.id("users"),
);

// ── Main validator ──────────────────────────────────────────────────────

const metadataValidator = v.object({
  subjectType: subjectTypeValidator,
  subjectId: subjectIdValidator,
  memoryType: memoryTypeValidator,
  content: v.string(),
  updatedAt: v.number(),
});

export {
  metadataValidator,
  subjectTypeValidator,
  subjectIdValidator,
  memoryTypeValidator,
};
