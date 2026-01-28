import { v } from "convex/values";

const nodeDatasSchema = v.object({
  templateId: v.optional(v.id("nodeTemplates")),
  template: v.optional(v.any()), // Override templateId if on the spot template is needed
  values: v.record(v.string(), v.any()), // Field values
  type: v.string(),
  updatedAt: v.number(),
  removedFromCanvasAt: v.optional(v.number()),
});

export default nodeDatasSchema;
