import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import canvasesSchema from "./schemas-and-validators/canvasesSchema";
import nodeDatasSchema from "./schemas-and-validators/nodeDatasSchema";

const schema = defineSchema({
  ...authTables,

  // ============================================================================
  // CANVAS
  // ============================================================================
  canvases: defineTable(canvasesSchema)
    .index("by_creator", ["creatorId"])
    .index("by_creator_and_updatedAt", ["creatorId", "updatedAt"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["creatorId"],
    }),

  nodeDatas: defineTable(nodeDatasSchema),

  // ============================================================================
  // NODE TEMPLATES
  // ============================================================================
  nodeTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    isSystem: v.boolean(),
    creatorId: v.optional(v.id("users")), // null if system template

    // Field definitions (columns)
    fields: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        type: v.union(
          v.literal("short_text"),
          v.literal("url"),
          v.literal("select"),
          v.literal("image"),
          v.literal("image_url"),
          v.literal("number"),
          v.literal("date"),
          v.literal("rich_text"),
          v.literal("boolean"),
          v.literal("document"),
          v.literal("file"),
        ),
        options: v.optional(v.any()), // currency, placeholder, select options, etc.
      }),
    ),

    // Visual layouts for node and window
    visuals: v.object({
      node: v.any(), // Record<string, NodeVisual>
      window: v.any(), // Record<string, NodeVisual>
    }),

    // Default variants
    defaultVisuals: v.object({
      node: v.string(), // variant_id
      window: v.string(), // variant_id
    }),

    // Metadata
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_system", ["isSystem"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["creatorId", "isSystem"],
    }),
});

export default schema;
