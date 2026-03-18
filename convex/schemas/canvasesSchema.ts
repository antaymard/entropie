import { v } from "convex/values";

// ── Sub-validators ──────────────────────────────────────────────────────

const canvasNodesValidator = v.object({
  id: v.string(),
  nodeDataId: v.optional(v.id("nodeDatas")),
  type: v.string(),
  position: v.object({
    x: v.number(),
    y: v.number(),
  }),
  width: v.number(),
  height: v.number(),
  locked: v.optional(v.boolean()),
  hidden: v.optional(v.boolean()),
  zIndex: v.optional(v.number()),
  color: v.optional(v.string()),
  variant: v.optional(v.string()),

  parentId: v.optional(v.string()),
  extent: v.optional(
    v.union(v.literal("parent"), v.array(v.array(v.number()))),
  ),
  extendParent: v.optional(v.boolean()),
  data: v.optional(v.record(v.string(), v.any())),
});

const edgesValidator = v.object({
  id: v.string(),
  source: v.string(),
  target: v.string(),

  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
  markerEnd: v.optional(v.any()),
  data: v.optional(v.record(v.string(), v.any())),
});

const slideshowsValidator = v.object({
  id: v.string(),
  name: v.string(),
  slides: v.optional(
    v.array(
      v.object({
        name: v.string(),
        viewport: v.any(),
      }),
    ),
  ),
});

// ── Main validator ──────────────────────────────────────────────────────

const canvasesValidator = v.object({
  creatorId: v.id("users"),
  name: v.string(),
  isPublic: v.optional(v.boolean()),

  nodes: v.optional(v.array(canvasNodesValidator)),
  edges: v.optional(v.array(edgesValidator)),

  slideshows: v.optional(v.array(slideshowsValidator)),

  updatedAt: v.number(),
});

export {
  canvasNodesValidator,
  edgesValidator,
  slideshowsValidator,
  canvasesValidator,
};
