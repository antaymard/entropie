import { z } from "zod";
import { zodToConvex, zid } from "convex-helpers/server/zod4";

const canvasNodesSchema = z.object({
  id: z.string(), // Pas _id
  nodeDataId: zid("nodeDatas").optional(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  width: z.number(),
  height: z.number(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  zIndex: z.number().optional(),
  color: z.string().optional(),
  variant: z.string().optional(),

  parentId: z.string().optional(),
  extent: z
    .union([z.literal("parent"), z.array(z.array(z.number()))])
    .optional(), // [[x1,y1], [x2,y2]]
  extendParent: z.boolean().optional(),
  data: z.record(z.string(), z.any()).optional(),
});

const edgesSchema = z.object({
  id: z.string(), // pas _id
  source: z.string(), // node id
  target: z.string(), // node id

  // Handles optionnels
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  markerEnd: z.any().optional(),
  data: z.record(z.string(), z.any()).optional(),
});

const canvasesSchema = z.object({
  // _id et _creationTime sont ajoutés automatiquement par Convex
  creatorId: zid("users"),
  name: z.string(),

  nodes: z.array(canvasNodesSchema).optional(),
  edges: z.array(edgesSchema).optional(),

  updatedAt: z.number(),
});

// Validators
const canvasNodesValidator = zodToConvex(canvasNodesSchema);
const edgesValidator = zodToConvex(edgesSchema);
const canvasesValidator = zodToConvex(canvasesSchema);

// Types TS
export type CanvasNode = z.infer<typeof canvasNodesSchema>;
export type Edge = z.infer<typeof edgesSchema>;
export type Canvas = z.infer<typeof canvasesSchema>;

export {
  canvasesSchema,
  canvasNodesSchema,
  edgesSchema,
  canvasNodesValidator,
  edgesValidator,
  canvasesValidator,
};
