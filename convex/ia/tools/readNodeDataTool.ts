"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { makeNodeDataLLMFriendly } from "../helpers/makeNodeDataLLMFriendly";

export const readNodeDataTool = createTool({
  description:
    "A tool to read node data from a onCanvasNodeId (not a canvasNodeId but the nodeDataId linked to it).",
  args: z.object({
    nodeId: z.string().describe("The ID of the **nodeData** to read data from"),
  }),
  handler: async (ctx, args): Promise<string> => {
    console.log(`🖼️ Reading node data with ID: ${args.nodeId}`);

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
