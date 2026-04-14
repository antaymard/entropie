import { createTool } from "@convex-dev/agent";
import { internal } from "../../_generated/api";
import { toolAgentNames, type ThreadCtx } from "../agentConfig";
import { nodeTypeValues } from "../../schemas/nodeTypeSchema";
import { validateNodeInputSchemaForLLM } from "../helpers/nodeInputSchemaValidatorForLLM";
import z from "zod";
import { ToolConfig, toolError } from "./toolHelpers";

// Tool compaction config
export const setNodeDataToolConfig: ToolConfig = {
  name: "set_node_data",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
    toolAgentNames.worker,
  ],
};

export default function setNodeDataTool({
  threadCtx,
}: {
  threadCtx: ThreadCtx;
}) {
  const { canvasId } = threadCtx;

  return createTool({
    description:
      "Set directement les valeurs du nodeData lié à un nodeId pour un type de node donné.",
    args: z.object({
      nodeType: z
        .enum(nodeTypeValues)
        .describe("Type du node cible (doit correspondre au nodeId fourni)."),
      nodeId: z.string().describe("ID canvas du node à mettre à jour."),
      data: z
        .record(z.string(), z.unknown())
        .describe("Objet values à écrire directement dans le nodeData lié."),
    }),
    handler: async (ctx, args): Promise<string> => {
      try {
        if (args.nodeType === "document") {
          return toolError(
            "Cannot set document data: use insert_document_content or string_replace_document_content.",
          );
        }

        if (args.nodeType === "table") {
          return toolError(
            "Cannot set table data: use table_insert_rows, table_delete_rows, or table_update_rows.",
          );
        }

        const validationError = validateNodeInputSchemaForLLM({
          nodeType: args.nodeType,
          input: args.data,
        });
        if (validationError) {
          return toolError(validationError);
        }

        const nodeLookup = await ctx.runQuery(
          internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
          {
            canvasId,
            nodeId: args.nodeId,
          },
        );

        if (nodeLookup.node.type !== args.nodeType) {
          return toolError(
            `Node type mismatch for nodeId ${args.nodeId}: expected ${args.nodeType}, got ${nodeLookup.node.type}.`,
          );
        }

        await ctx.runMutation(internal.wrappers.nodeDataWrappers.updateValues, {
          _id: nodeLookup.nodeData._id,
          values: args.data,
        });

        return `Node data updated for nodeId ${args.nodeId}.`;
      } catch (error) {
        return toolError(
          `Error while setting node data for nodeId ${args.nodeId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  });
}
