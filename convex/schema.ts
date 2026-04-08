import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { canvasesValidator } from "./schemas/canvasesSchema";
import { nodeDatasValidator } from "./schemas/nodeDatasSchema";
import { scheduledJobsValidator } from "./schemas/scheduledJobsSchema";
import { sharesValidator } from "./schemas/sharesSchema";
import { memoriesValidator } from "./schemas/memoriesSchema";
import { searchableChunksValidator } from "./schemas/searchableChunksSchema";

const schema = defineSchema({
  ...authTables,

  // ============================================================================
  // CANVAS
  // ============================================================================
  canvases: defineTable(canvasesValidator)
    .index("by_creator", ["creatorId"])
    .index("by_creator_and_updatedAt", ["creatorId", "updatedAt"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["creatorId"],
    }),

  nodeDatas: defineTable(nodeDatasValidator).index("by_canvasId", ["canvasId"]),

  // ============================================================================
  // SHARES
  // ============================================================================
  shares: defineTable(sharesValidator)
    .index("by_canvas_and_user", ["canvasId", "userId"])
    .index("by_user", ["userId"])
    .index("by_canvas", ["canvasId"]),

  scheduledJobs: defineTable(scheduledJobsValidator).index("by_nodeDataId", [
    "nodesDataId",
  ]),

  memories: defineTable(memoriesValidator)
    .index("by_subject_and_type", ["subjectId", "type"])
    .index("by_canvasId", ["canvasId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["subjectType", "subjectId", "type"],
    }),

  // ============================================================================
  // SEARCH
  // ============================================================================
  searchableChunks: defineTable(searchableChunksValidator)
    .index("by_nodeDataId", ["nodeDataId"])
    .index("by_nodeDataId_and_fieldPath", ["nodeDataId", "fieldPath"])
    .index("by_canvasId", ["canvasId"])
    .searchIndex("search_text", {
      searchField: "text",
      filterFields: [
        "canvasId",
        "nodeDataId",
        "nodeType",
        "chunkType",
        "fieldPath",
      ],
    }),
});

export default schema;
