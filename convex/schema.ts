import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { canvasesValidator } from "./schemas/canvasesSchema";
import { nodeDatasValidator } from "./schemas/nodeDatasSchema";
import { scheduledJobsValidator } from "./schemas/scheduledJobsSchema";
import { sharesValidator } from "./schemas/sharesSchema";
import { metadatasValidator } from "./schemas/metadatasSchema";

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

  nodeDatas: defineTable(nodeDatasValidator).index("by_canvasId", [
    "canvasId",
  ]),

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

  metadatas: defineTable(metadatasValidator)
    .index("by_subject_and_type", ["subjectId", "type"])
    .index("by_canvasId", ["canvasId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["subjectType", "subjectId", "type"],
    }),

});

export default schema;
