import { createTool, createThread } from "@convex-dev/agent";
import { z } from "zod";
import { components } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import { nodeTypeValues } from "../../schemas/nodeTypeSchema";
import { createToolAgent } from "../agents";
import writeEdgeDynamicTool from "./writeEdgeDynamicTool";
import writeNodeDynamicTool from "./writeNodeDynamicTool";

export default function nodeAgentTool({
  authUserId,
  canvasId,
}: {
  authUserId: Id<"users">;
  canvasId: Id<"canvases">;
}) {
  return createTool({
    description:
      "Launch a focused subagent to create/update/delete nodes and edges on the current canvas.",
    args: z.object({
      nodeType: z
        .enum(nodeTypeValues)
        .describe("Node type the subagent should focus on."),
      query: z
        .string()
        .describe(
          "Natural-language instruction for the subagent describing what to build or modify. Please provide the required details in the query : nodeId if you want to update a specific node, source and target nodeIds if you want to create an edge, etc. And give the proper data you want to be written in the node regarding the nodeType.",
        ),
    }),
    handler: async (
      ctx,
      { nodeType, query },
    ): Promise<{
      success: boolean;
      nodeType: string;
      response: string;
    }> => {
      const subAgent = createToolAgent({
        modelName: "mistralai/mistral-small-2603",
        instructions:
          "You are a focused canvas editing subagent. Use the provided tools to modify the canvas. Prefer minimal, precise changes and do not invent IDs.",
        tools: {
          writeNodeDynamicTool: writeNodeDynamicTool({
            ctx: ctx as ActionCtx,
            canvasId,
            nodeType,
          }),
          writeEdgeDynamicTool: writeEdgeDynamicTool({
            ctx: ctx as ActionCtx,
            canvasId,
          }),
        },
      });

      const threadId = await createThread(ctx, components.agent, {
        userId: authUserId,
      });

      const result = await subAgent.generateText(
        ctx,
        {
          threadId,
          userId: authUserId,
        },
        {
          prompt: query,
        },
      );

      return {
        success: true,
        nodeType,
        response: result.text,
      };
    },
  });
}
