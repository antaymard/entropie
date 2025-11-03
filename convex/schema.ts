import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // ============================================================================
  // CANVAS
  // ============================================================================
  canvases: defineTable({
    userId: v.string(),
    title: v.string(),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),

    // Settings du canvas
    // settings: v.object({
    //   gridSize: v.optional(v.number()),
    //   snapToGrid: v.optional(v.boolean()),
    //   backgroundColor: v.optional(v.string()),
    //   defaultZoom: v.optional(v.number()),
    // }),

    // Partage et permissions
    // sharing: v.object({
    //   isPublic: v.boolean(),
    //   sharedWith: v.array(v.string()), // userIds
    //   permissions: v.optional(v.any()), // Record<userId, "read" | "write">
    // }),

    // Metadata
    // lastViewedAt: v.optional(v.number()),
    // isFavorite: v.optional(v.boolean()),
    // tags: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    // .index("by_user_favorite", ["userId", "isFavorite"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId"],
    }),

  // ============================================================================
  // NODE DISPLAYS (apparence et position des nodes)
  // ============================================================================
  nodeDisplays: defineTable({
    // Relations
    canvasId: v.id("canvases"),
    frameId: v.optional(v.id("frames")), // null = sur le canvas root
    nodeDataId: v.id("nodeData"),
    templateId: v.id("nodeTemplates"), // Dénormalisé pour perf

    // Position et taille
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    size: v.object({
      width: v.number(),
      height: v.number(),
    }),

    // Apparence
    color: v.optional(v.string()),
    zIndex: v.number(),
    isLocked: v.boolean(),

    // Variants visuels
    nodeVariantId: v.string(), // UUID du variant dans nodeTemplate.visuals.node
    windowVariantId: v.string(), // UUID du variant dans nodeTemplate.visuals.window
  })
    .index("by_canvas", ["canvasId"])
    .index("by_canvas_zindex", ["canvasId", "zIndex"])
    .index("by_nodeData", ["nodeDataId"])
    .index("by_frame", ["frameId"])
    .index("by_template", ["templateId"]), // Pour retrouver tous les nodes d'un template

  // ============================================================================
  // NODE DATA (contenu des nodes)
  // ============================================================================
  nodeData: defineTable({
    userId: v.string(),
    templateId: v.id("nodeTemplates"),

    // Valeurs des champs (flexibles selon le template)
    fieldValues: v.any(), // Record<field_id, any>

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),

    // Pour les nodes connectés à des sources externes
    // externalSync: v.optional(
    //   v.object({
    //     source: v.string(), // "n8n", "api", "web_scraping", etc.
    //     endpoint: v.optional(v.string()),
    //     lastFetchedAt: v.optional(v.number()),
    //     fetchInterval: v.optional(v.number()), // en ms
    //     isActive: v.optional(v.boolean()),
    //   })
    // ),

    // Historisation (pour ton use case de surveillance)
    // history: v.optional(
    //   v.array(
    //     v.object({
    //       timestamp: v.number(),
    //       fieldValues: v.any(),
    //       changedBy: v.optional(v.string()),
    //       changeType: v.optional(v.string()), // "manual", "automation", "external_sync"
    //     })
    //   )
    // ),
  })
    .index("by_user", ["userId"])
    .index("by_template", ["templateId"])
    .index("by_user_template", ["userId", "templateId"]),
  // Pour retrouver les nodes à sync
  // .index("by_external_sync", [
  //   "externalSync.isActive",
  //   "externalSync.lastFetchedAt",
  // ]),

  // ============================================================================
  // FRAMES (zones géographiques sur le canvas)
  // ============================================================================
  frames: defineTable({
    canvasId: v.id("canvases"),
    title: v.string(),
    description: v.optional(v.string()),

    // Position et taille
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    size: v.object({
      width: v.number(),
      height: v.number(),
    }),

    // Style
    backgroundColor: v.optional(v.string()),
    borderColor: v.optional(v.string()),
    borderWidth: v.optional(v.number()),

    zIndex: v.number(),
    isLocked: v.optional(v.boolean()),
  }).index("by_canvas", ["canvasId"]),

  // ============================================================================
  // EDGES (connecteurs entre nodes)
  // ============================================================================
  edges: defineTable({
    canvasId: v.id("canvases"),
    frameId: v.optional(v.id("frames")), // null = sur le canvas root

    // Source et target
    sourceDisplayId: v.id("nodeDisplays"),
    targetDisplayId: v.id("nodeDisplays"),

    // Style
    style: v.optional(
      v.object({
        color: v.optional(v.string()),
        width: v.optional(v.number()),
        type: v.optional(
          v.union(
            v.literal("straight"),
            v.literal("curved"),
            v.literal("step"),
            v.literal("smoothstep")
          )
        ),
        animated: v.optional(v.boolean()),
        dashed: v.optional(v.boolean()),
      })
    ),

    // Label
    label: v.optional(v.string()),
    labelPosition: v.optional(v.number()), // 0 à 1 (position sur l'edge)

    // Metadata
    relationshipType: v.optional(v.string()), // "depends_on", "related_to", "child_of", etc.
    isLocked: v.optional(v.boolean()),
  })
    .index("by_canvas", ["canvasId"])
    .index("by_source", ["sourceDisplayId"])
    .index("by_target", ["targetDisplayId"])
    .index("by_canvas_source", ["canvasId", "sourceDisplayId"])
    .index("by_canvas_target", ["canvasId", "targetDisplayId"]),
});

export default schema;
