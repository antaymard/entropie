import { v } from "convex/values";
import _ from "lodash";

const nodeDatasSchema = v.object({
  _id: v.id("nodeDatas"),
  templateId: v.optional(v.id("nodeTemplates")),
  template: v.optional(v.any()), // Override templateId if on the spot template is needed
  values: v.record(v.string(), v.any()), // Field values
  type: v.string(),
  updatedAt: v.number(),
  removedFromCanvasAt: v.optional(v.number()),
});

export default nodeDatasSchema;
