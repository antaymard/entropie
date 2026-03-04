import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { nodeFields, nodeTypes } from "../helpers/nodeFieldsAndTypesHelper";
import { encode } from "@toon-format/toon";

export const readNodeConfigsTool = createTool({
  description:
    "Use this tool to retrieve the available node types or node fields. It returns a list of nodes or fields with their labels, types, and expected data structure. Use it before creating or editing nodes to ensure you have the correct data format.",
  args: z.object({
    operation: z
      .enum([
        "listAllNodeTypes",
        "readOneNodeType",
        "listAllNodeFields",
        "readOneNodeField",
        // "readOneNodeTemplate",
        // "listAllNodeTemplates",
      ])
      .describe("The operation to perform."),
    itemType: z
      .string()
      .optional()
      .describe(
        "The specific node type or field to read, required for readOneNodeType and readOneNodeField operations."
      ),
  }),
  handler: async (ctx, { operation, itemType }) => {
    console.log("readNodeConfigsTool called with:", { operation, itemType });
    switch (operation) {
      case "listAllNodeTypes":
        return encode(nodeTypes);

      case "readOneNodeType": {
        if (!itemType) {
          return `Error: itemType is required. Available types: ${nodeTypes.map((n) => n.type).join(", ")}`;
        }
        const nodeType = nodeTypes.find((n) => n.type === itemType);
        if (!nodeType) {
          return `Error: Node type "${itemType}" not found. Available types: ${nodeTypes.map((n) => n.type).join(", ")}`;
        }
        return encode(nodeType);
      }

      case "listAllNodeFields":
        return encode(nodeFields);

      case "readOneNodeField": {
        if (!itemType) {
          return `Error: itemType is required. Available fields: ${nodeFields.map((f) => f.type).join(", ")}`;
        }
        const nodeField = nodeFields.find((f) => f.type === itemType);
        if (!nodeField) {
          return `Error: Node field "${itemType}" not found. Available fields: ${nodeFields.map((f) => f.type).join(", ")}`;
        }
        return encode(nodeField);
      }

      default:
        return `Error: Unknown operation: ${operation}`;
    }
  },
});
