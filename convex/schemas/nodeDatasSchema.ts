import { v } from "convex/values";

const nodeDatasSchema = v.object({
  _id: v.id("nodeDatas"),
  templateId: v.optional(v.id("nodeTemplates")),
  template: v.optional(v.any()), // Override templateId if on the spot template is needed
  type: v.string(),
  updatedAt: v.number(),
  removedFromCanvasAt: v.optional(v.number()),

  values: v.record(v.string(), v.any()), // Field values
  status: v.optional(
    v.union(v.literal("idle"), v.literal("working"), v.literal("error")),
  ),

  agent: v.optional(
    v.object({
      model: v.string(),
      instructions: v.string(),
      touchableFields: v.optional(v.array(v.string())),
    }),
  ),
  dataProcessing: v.optional(
    v.array(
      v.object({
        field: v.string(), // Field to update with the processed data
        sourceNode: v.id("nodeDatas"),
        expression: v.string(), // JSONata expression to process the data
      }),
    ),
  ),
  automationMode: v.optional(
    v.union(v.literal("agent"), v.literal("dataProcessing"), v.literal("off")),
  ),
  dependencies: v.optional(
    v.array(
      v.object({
        nodeDataId: v.id("nodeDatas"),
        field: v.optional(v.string()),
        type: v.union(v.literal("input"), v.literal("output")),
        degree: v.optional(v.number()),
        shouldTriggerUpdate: v.optional(v.boolean()),
      }),
    ),
  ),
  // history: v.optional(
  //   v.array(
  //     v.object({
  //       timestamp: v.number(),
  //       action: v.string(),
  //       details: v.optional(v.any()),
  //     }),
  //   ),
  // ),
});

export default nodeDatasSchema;
