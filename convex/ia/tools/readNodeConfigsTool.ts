import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { nodeDataConfig } from "../../config/nodeConfig";
import type { NodeDataConfigItem } from "../../config/nodeConfig";
import { encode } from "@toon-format/toon";

function serializeForLLM(config: NodeDataConfigItem) {
  let inputSchema: unknown = null;
  try {
    const zodJs = z as unknown as {
      toJSONSchema?: (s: z.ZodTypeAny) => unknown;
    };
    if (typeof zodJs.toJSONSchema === "function") {
      inputSchema = zodJs.toJSONSchema(
        config.toolInputSchema ?? config.dataValuesSchema,
      );
    }
  } catch {
    // ignore serialization errors
  }
  return {
    type: config.type,
    label: config.label,
    description: config.description,
    defaultDimensions: config.defaultDimensions,
    variants: config.variants ?? null,
    canHaveAutomation: config.canHaveAutomation,
    inputSchema,
  };
}

export const readNodeConfigsTool = createTool({
  description:
    "Use this tool to retrieve the available node types. It returns a list of nodes with their labels, types, default dimensions, and expected data structure. Use it before creating or editing nodes to ensure you have the correct data format.",
  args: z.object({
    operation: z
      .enum(["listAllNodeTypes", "readOneNodeType"])
      .describe("The operation to perform."),
    itemType: z
      .string()
      .optional()
      .describe(
        "The specific node type to read, required for readOneNodeType.",
      ),
  }),
  handler: async (ctx, { operation, itemType }) => {
    console.log("readNodeConfigsTool called with:", { operation, itemType });
    switch (operation) {
      case "listAllNodeTypes":
        return encode(nodeDataConfig.map(serializeForLLM));

      case "readOneNodeType": {
        if (!itemType) {
          return `Error: itemType is required. Available types: ${nodeDataConfig.map((n) => n.type).join(", ")}`;
        }
        const nodeConfig = nodeDataConfig.find((n) => n.type === itemType);
        if (!nodeConfig) {
          return `Error: Node type "${itemType}" not found. Available types: ${nodeDataConfig.map((n) => n.type).join(", ")}`;
        }
        return encode(serializeForLLM(nodeConfig));
      }

      default:
        return `Error: Unknown operation: ${operation}`;
    }
  },
});
