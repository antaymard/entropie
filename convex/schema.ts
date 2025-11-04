import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // ============================================================================
  // CANVAS
  // ============================================================================
  canvases: defineTable({
    creatorId: v.id("users"),
    name: v.string(),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),

    // Nodes et edges (dénormalisés pour ReactFlow)
    nodes: v.array(
      v.object({
        id: v.string(),
        name: v.optional(v.string()), // Displayed on the node
        type: v.string(), // customNode or frame or pre-built node types
        templateId: v.optional(v.id("nodeTemplates")), // If based on a template

        position: v.object({
          x: v.number(),
          y: v.number(),
        }),
        width: v.number(),
        height: v.number(),
        color: v.optional(v.string()),
        locked: v.optional(v.boolean()),
        hidden: v.optional(v.boolean()),
        zIndex: v.optional(v.number()),

        data: v.any(),
        parentId: v.optional(v.string()),
        extent: v.optional(
          v.union(v.literal("parent"), v.array(v.array(v.number()))) // [[x1,y1], [x2,y2]]
        ),
        extendParent: v.optional(v.boolean()),
      })
    ), // ReactFlow nodes (position, data, type, etc.)
    edges: v.array(
      v.object({
        id: v.string(),
        source: v.string(), // node id
        target: v.string(), // node id

        // Handles optionnels
        sourceHandle: v.optional(v.string()),
        targetHandle: v.optional(v.string()),

        // Style
        // type: v.optional(v.string()), // "default", "straight", "step", "smoothstep"
        // animated: v.optional(v.boolean()),
        // label: v.optional(v.string()),
        // style: v.optional(v.any()),
        // className: v.optional(v.string()),

        // Data custom
        data: v.optional(v.any()),
      })
    ), // ReactFlow edges (source, target, style, etc.)

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["creatorId"],
    }),
});

export default schema;
