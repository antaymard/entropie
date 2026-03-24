import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { makeNodeDataLLMFriendly } from "../helpers/makeNodeDataLLMFriendly";

export const writeNodeTool = createTool({
  description:
    "A tool to edit a nodeData, for a given nodeDataId (not a idOnCanvas but the nodeDataId linked to it).",
  args: z.object({
    nodeDataId: z
      .string()
      .describe("The ID of the **nodeData** to write data to"),
  }),
  handler: async (ctx, args): Promise<string> => {
    console.log(`🖼️ Writing node data with ID: ${args.nodeDataId}`);

    try {
      const nodeData = await ctx.runQuery(
        internal.wrappers.nodeDataWrappers.readNodeData,
        {
          _id: args.nodeId as Id<"nodeDatas">,
        },
      );

      console.log(`✅ Node data read complete`);
      return makeNodeDataLLMFriendly(nodeData);
    } catch (error) {
      console.error("Read node data error:", error);
      throw new Error(
        `Failed to read node data: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the ID and try again.`,
      );
    }
  },
});
