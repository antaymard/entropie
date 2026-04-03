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
      "Launch a focused subagent to create nodes with initial content, update nodes (all types but document and tables) and create/update edges on the current canvas. To update document, use the string_replace_document_content and insert_document_content tools instead.",
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
          "You are a focused canvas editing subagent. \nUse the provided tools to modify the canvas. \nPrefer minimal, precise changes and do not invent IDs. \n\nIf the tools provided do not allow you to make the change you want, do not make any change and explain in the response that you cannot perform the requested modification, and which tool would be needed to perform it. \n\nIf an error occurs while executing a tool, fix it by yourself if you can (formatting error, wrong parameter, etc). But if you cannot fix it by yourself, return the error to the main agent. Also include the actions you have already performed (node creation with created id, move position...) so the main agent does not repeat them, and explain what you were not able to do and why.",
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
        title:
          "__subagent_thread__ - node agent subagent for canvas " + canvasId,
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
