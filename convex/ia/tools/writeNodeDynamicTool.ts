import { dynamicTool } from "ai";
import { internal } from "../../_generated/api";
import { type Id } from "../../_generated/dataModel";
import { type ActionCtx } from "../../_generated/server";
import { nodeDataConfig } from "../../config/nodeConfig";
import { markdownToPlateJson } from "../helpers/plateMarkdownConverter";
import { validateNodeInputSchemaForLLM } from "../helpers/nodeInputSchemaValidatorForLLM";
import { type NodeType } from "../../schemas/nodeTypeSchema";
import { generateLlmId } from "../../lib/llmId";
import { stringifyPlateDocumentForStorage } from "../../lib/plateDocumentStorage";
import z from "zod";

function getNodeDataValuesSchema(nodeType: NodeType): z.ZodTypeAny {
  const config = nodeDataConfig.find((item) => item.type === nodeType);
  if (!config) {
    throw new Error(`No node config found for node type: ${nodeType}`);
  }

  return config.toolInputSchema ?? config.dataValuesSchema;
}

export default function writeNodeDynamicTool({
  ctx,
  canvasId,
  nodeType,
}: {
  ctx: ActionCtx;
  canvasId: Id<"canvases">;
  nodeType: NodeType;
}) {
  const nodeDataValuesSchema = getNodeDataValuesSchema(nodeType);
  const toolInputSchema = z.object({
    operation: z
      .enum(["create", "update"])
      .describe(
        "Whether to create a new node or update an existing one. You cannot update existing document or table node with this tool, only create them. For updates on document nodes, the string_replace_document_content and insert_document_content tools should be used instead.",
      ),
    nodeId: z
      .string()
      .optional()
      .describe(
        "The ID in the canvas of the node to update. Required for update.",
      ),
    position: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional()
      .describe("The x/y position of the node on the canvas."),
    dimensions: z
      .object({
        width: z.number(),
        height: z.number(),
      })
      .optional()
      .describe("The width/height of the node on the canvas."),
    nodeDataValues: nodeDataValuesSchema.describe(
      "Node data values payload validated dynamically from nodeConfig based on node type.",
    ),
  });

  return dynamicTool({
    description: `Tool for creating or updating writing data to a node of type ${nodeType}. The input schema and the update logic are defined at runtime based on the node type.`,
    inputSchema: toolInputSchema,
    execute: async (args) => {
      try {
        const parsedArgs = toolInputSchema.parse(args);

        if (nodeType === "document" && parsedArgs.operation === "update") {
          return "This tool is not appropriate for editing an existing document node. Use the string_replace_document_content and insert_document_content tools instead.";
        }
        if (nodeType === "table" && parsedArgs.operation === "update") {
          return "This tool is not appropriate for editing an existing table node. Use the table_update_rows, table_insert_rows, and table_delete_rows tools instead.";
        }

        const validationError = validateNodeInputSchemaForLLM({
          nodeType,
          input: parsedArgs.nodeDataValues,
        });
        if (validationError) {
          return validationError;
        }

        let nodeDataValues = parsedArgs.nodeDataValues as Record<
          string,
          unknown
        >;

        if (nodeType === "document" && typeof nodeDataValues.doc === "string") {
          nodeDataValues = {
            ...nodeDataValues,
            doc: stringifyPlateDocumentForStorage(
              markdownToPlateJson(nodeDataValues.doc),
            ),
          };
        }

        if (parsedArgs.operation === "create") {
          if (!parsedArgs.position || !parsedArgs.dimensions) {
            return "Create operation requires position and dimensions.";
          }

          const newNodeDataId = await ctx.runMutation(
            internal.wrappers.nodeDataWrappers.create,
            {
              type: nodeType,
              values: nodeDataValues,
            },
          );

          const newNodeId = generateLlmId();

          await ctx.runMutation(internal.wrappers.canvasNodeWrappers.add, {
            canvasId,
            canvasNodes: [
              {
                id: newNodeId,
                nodeDataId: newNodeDataId,
                type: nodeType,
                position: parsedArgs.position,
                width: parsedArgs.dimensions.width,
                height: parsedArgs.dimensions.height,
              },
            ],
          });

          return {
            success: true,
            operation: "create",
            nodeId: newNodeId,
            nodeDataId: newNodeDataId,
            position: parsedArgs.position,
            dimensions: parsedArgs.dimensions,
            nodeDataValues,
          };
        }

        if (!parsedArgs.nodeId) {
          return "Update operation requires nodeId.";
        }

        const nodeLookup = await ctx.runQuery(
          internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
          {
            canvasId,
            nodeId: parsedArgs.nodeId,
          },
        );

        await ctx.runMutation(internal.wrappers.nodeDataWrappers.updateValues, {
          _id: nodeLookup.nodeData._id,
          values: nodeDataValues,
        });

        const hasPositionOrDimensions = Boolean(
          parsedArgs.position || parsedArgs.dimensions,
        );
        if (hasPositionOrDimensions) {
          await ctx.runMutation(
            internal.wrappers.canvasNodeWrappers.updatePositionOrDimensions,
            {
              canvasId,
              nodeChanges: [
                {
                  id: parsedArgs.nodeId,
                  position: parsedArgs.position,
                  dimensions: parsedArgs.dimensions,
                },
              ],
            },
          );
        }

        return {
          success: true,
          operation: "update",
          nodeId: parsedArgs.nodeId,
          nodeDataId: nodeLookup.nodeData._id,
          position: parsedArgs.position ?? nodeLookup.node.position,
          dimensions: {
            width: parsedArgs.dimensions?.width ?? nodeLookup.node.width,
            height: parsedArgs.dimensions?.height ?? nodeLookup.node.height,
          },
          nodeDataValues,
        };
      } catch (error) {
        return `Error while writing node data: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
}
