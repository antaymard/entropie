import { v } from "convex/values";

const canvasNodesSchema = v.object({
  nodeDataId: v.id("nodeDatas"),
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
  parentId: v.optional(v.string()),
  extent: v.optional(
    v.union(v.literal("parent"), v.array(v.array(v.number()))), // [[x1,y1], [x2,y2]]
  ),
  extendParent: v.optional(v.boolean()),
  data: v.optional(v.any()),
});

const edgesSchema = v.object({
  id: v.string(),
  source: v.string(), // node id
  target: v.string(), // node id

  // Handles optionnels
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
  data: v.optional(v.any()),
});

const canvasesSchema = {
  creatorId: v.id("users"),
  name: v.string(),
  icon: v.optional(v.string()),

  nodes: v.array(canvasNodesSchema),
  edges: v.array(edgesSchema),

  updatedAt: v.number(),
};

export default canvasesSchema;
export { canvasNodesSchema, edgesSchema };
