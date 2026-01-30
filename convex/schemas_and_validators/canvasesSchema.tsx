import { v } from "convex/values";

const canvasNodesSchema = v.object({
  id: v.string(), // Pas _id
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

  parentId: v.optional(v.string()),
  extent: v.optional(
    v.union(v.literal("parent"), v.array(v.array(v.number()))), // [[x1,y1], [x2,y2]]
  ),
  extendParent: v.optional(v.boolean()),
  data: v.optional(v.record(v.string(), v.any())),
});

const edgesSchema = v.object({
  id: v.string(), // pas _id
  source: v.string(), // node id
  target: v.string(), // node id

  // Handles optionnels
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
  data: v.optional(v.record(v.string(), v.any())),
});

const canvasesSchema = {
  // _id et _creationTime sont ajoutés automatiquement par Convex
  creatorId: v.id("users"),
  name: v.string(),

  nodes: v.optional(v.array(canvasNodesSchema)),
  edges: v.optional(v.array(edgesSchema)),

  updatedAt: v.number(),
};

export default canvasesSchema;
export { canvasNodesSchema, edgesSchema };
