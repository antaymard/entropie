import { createTool, createThread } from "@convex-dev/agent";
import { z } from "zod";
import { components, internal } from "../../_generated/api";
import type { ActionCtx } from "../../_generated/server";
import { matchLlmIdsInText } from "../../lib/llmId";
import { nodeTypeValues } from "../../schemas/nodeTypeSchema";
import { createToolAgent } from "../agents";
import type { NoleToolRuntimeContext } from "../noleToolRuntimeContext";
import writeEdgeDynamicTool from "./writeEdgeDynamicTool";
import writeNodeDynamicTool from "./writeNodeDynamicTool";

export default function nodeAgentTool({
  authUserId,
  canvasId,
}: NoleToolRuntimeContext) {
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
          "Natural-language instruction for the subagent describing what to build or modify. This tool is a bridge between natural language instructions and canvas modifications, so the more precise and detailed the query is, the better the subagent will perform. The subagent has the positions and dimensions of the nodes you mention in the query as context, so you can refer to them in the instruction.",
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
      console.log(
        `🚀 Launching node agent subagent for canvas ${canvasId} with query: ${query}`,
      );

      const referencedNodeIds = matchLlmIdsInText(query);
      const referencedNodes = await Promise.all(
        referencedNodeIds.map(async (nodeId) => {
          try {
            const nodeWithNodeData = await ctx.runQuery(
              internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
              {
                canvasId,
                nodeId,
              },
            );

            return {
              nodeId,
              node: nodeWithNodeData.node,
            };
          } catch {
            return null;
          }
        }),
      );

      const resolvedReferencedNodes = referencedNodes.filter(
        (entry): entry is NonNullable<typeof entry> => entry !== null,
      );

      const promptWithNodeContext =
        resolvedReferencedNodes.length > 0
          ? `${query}\n\nHere are some relevant informations for your context.\n<nodes>\n${resolvedReferencedNodes
              .map(
                ({ nodeId, node }) =>
                  `<node id="${nodeId}" position="${node.position.x},${node.position.y}" height="${node.height}" width="${node.width}" context="mentionned in the query"/>`,
              )
              .join("\n")}\n</nodes>`
          : query;

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
          prompt: promptWithNodeContext,
        },
      );

      console.log(
        `✅ Node agent subagent completed for canvas ${canvasId} : ${result.text}`,
      );

      return {
        success: true,
        nodeType,
        response: result.text,
      };
    },
  });
}
