import { v } from "convex/values";

const nodeDatasSchema = v.object({
  templateId: v.id("nodeTemplates"),
  template: v.any(), // Override templateId if one the spot template is needed
  data: v.record(v.string(), v.any()), // Field values
  updatedAt: v.number(),
  removedFromCanvasAt: v.optional(v.number()),
});

export default nodeDatasSchema;
