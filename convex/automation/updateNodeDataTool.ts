import { createTool } from "@convex-dev/agent";
import { z } from "zod";

export const updateNodeDataTool = createTool({
  description: "Update the node data with new information.",
  args: z.object({}),
  handler: async (
    ctx,
    { objective, search_queries = [], search_effort = "low" },
  ) => {
    console.log(`🔄 Updating node data`);
    try {
      return "success";
    } catch (error: any) {
      console.error("❌ Update node data error:", error);
      return `Update node data failed: ${error.message}. Please try rephrasing your query.`;
    }
  },
});
