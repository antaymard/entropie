import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { nodeTypes } from "../helpers/nodeFieldsAndTypesHelper";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  expectedFormat?: object;
}

function validateNodeData(
  nodeType: string,
  nodeData: Record<string, unknown> | undefined
): ValidationResult {
  const nodeConfig = nodeTypes.find((n) => n.type === nodeType);

  if (!nodeConfig) {
    return {
      isValid: false,
      errors: [
        `Unknown node type: "${nodeType}". Available types: ${nodeTypes.map((n) => n.type).join(", ")}`,
      ],
      expectedFormat: {
        availableTypes: nodeTypes.map((n) => ({
          type: n.type,
          label: n.label,
          description: n.description,
        })),
      },
    };
  }

  const expectedProps = nodeConfig.expectedDataProps;
  if (!expectedProps || !expectedProps.properties) {
    // No specific validation required
    return { isValid: true, errors: [] };
  }

  const errors: string[] = [];
  const data = nodeData || {};

  // Check for unexpected properties
  const allowedProps = new Set(expectedProps.properties.map((p) => p.name));
  const dataKeys = Object.keys(data);
  for (const key of dataKeys) {
    if (!allowedProps.has(key)) {
      errors.push(
        `Unexpected property "${key}" for node type "${nodeType}". Allowed properties: ${[...allowedProps].join(", ") || "none"}.`
      );
    }
  }

  // Check required properties
  for (const prop of expectedProps.properties) {
    if (prop.required && !(prop.name in data)) {
      errors.push(
        `Missing required property "${prop.name}" for node type "${nodeType}".`
      );
    }

    // Check type if property exists
    if (prop.name in data) {
      const value = data[prop.name];

      if (prop.type === "string" && typeof value !== "string") {
        errors.push(
          `Property "${prop.name}" should be a string, got ${typeof value}.`
        );
      }

      if (prop.type === "number" && typeof value !== "number") {
        errors.push(
          `Property "${prop.name}" should be a number, got ${typeof value}.`
        );
      }

      if (prop.type === "array" && !Array.isArray(value)) {
        errors.push(
          `Property "${prop.name}" should be an array, got ${typeof value}.`
        );
      }

      // Check enum values
      if (prop.enum && !prop.enum.includes(value as string)) {
        errors.push(
          `Property "${prop.name}" must be one of: ${prop.enum.join(", ")}. Got "${value}".`
        );
      }
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      expectedFormat: {
        nodeType: nodeConfig.type,
        label: nodeConfig.label,
        description: nodeConfig.description,
        expectedDataProps: nodeConfig.expectedDataProps,
        dataExample: nodeConfig.dataExample,
      },
    };
  }

  return { isValid: true, errors: [] };
}

export const editCanvasNodesAndEdgesTool = createTool({
  description:
    "**Before using this tool, you must use read_node_configs to get the correct data structure for the node type you want to create or edit.** Otherwise, the data you pass will be rejected. Edit nodes on a user canvas. This tool allows you to create or edit nodes on a specified canvas.",
  args: z.object({
    canvas_id: z
      .string()
      .describe("ID of the canvas where the nodes will be modified."),
    nodes: z.array(
      z.object({
        operation: z
          .enum(["create", "edit"])
          .describe("The operation to perform on the node.")
          .default("create"),
        node_id: z
          .string()
          .describe(
            "ID of the node to edit. Required for edit operation, ignored for create."
          )
          .optional(),
        name: z
          .string()
          .describe("Name of the node, displayed in the node header."),
        node_type: z
          .string()
          .describe(
            "Type of the node (nodeType). Use readNodeConfigsTool to get the available node types. Required for create, optional for edit."
          )
          .optional(),
        node_data: z
          .object({})
          .passthrough()
          .describe(
            "Data for the node. Use readNodeConfigsTool to get the expected data structure for each node type."
          )
          .optional(),
        position: z
          .object({
            x: z.number().describe("X position on the canvas."),
            y: z.number().describe("Y position on the canvas."),
          })
          .optional()
          .describe("Position of the node on the canvas. Optional for edit."),
        dimensions: z
          .object({
            width: z.number().describe("Width of the node."),
            height: z.number().describe("Height of the node."),
          })
          .optional()
          .describe(
            "Dimensions of the node. If omitted, min dimensions will be used."
          ),
      })
    ),
  }),
  handler: async (ctx, { canvas_id, nodes }) => {
    try {
      const createdNodeIds: string[] = [];
      const editedNodeIds: string[] = [];
      const errors: string[] = [];
      const detailedValidationErrors: string[] = [];

      // Handle CREATE operations
      const nodesToCreate = nodes.filter((n) => n.operation === "create");
      if (nodesToCreate.length > 0) {
        const missingTypes = nodesToCreate.filter((n) => !n.node_type);
        if (missingTypes.length > 0) {
          errors.push(
            `${missingTypes.length} node(s) missing required node_type for create operation.`
          );
        }

        const validNodesToCreate = nodesToCreate.filter((n) => n.node_type);

        // Validate node data against expected schema
        const validationResults: {
          node: (typeof validNodesToCreate)[0];
          validation: ValidationResult;
        }[] = [];

        for (const node of validNodesToCreate) {
          const validation = validateNodeData(
            node.node_type!,
            node.node_data as Record<string, unknown>
          );
          if (!validation.isValid) {
            const nodeName = node.name || node.node_type!;
            errors.push(`Node "${nodeName}" validation failed`);

            // Create detailed error messages with expected format
            detailedValidationErrors.push(
              `Node: ${nodeName}\n` +
                `Errors: ${validation.errors.join("; ")}\n` +
                `Expected format: ${JSON.stringify(validation.expectedFormat, null, 2)}`
            );
          } else {
            validationResults.push({ node, validation });
          }
        }

        // Only create nodes that passed validation
        const nodesPassingValidation = validationResults.map((v) => v.node);
        if (nodesPassingValidation.length > 0) {
          const newNodeIds = nodesPassingValidation.map(
            () => `node-${crypto.randomUUID()}`
          );

          await ctx.runMutation(
            internal.ia.helpers.canvasHelpers.addNodesToCanvasInternal,
            {
              canvasId: canvas_id as Id<"canvases">,
              newNodes: nodesPassingValidation.map((node, index) => ({
                id: newNodeIds[index],
                name: node.name || `${node.node_type}_node`,
                type: node.node_type!,
                data: node.node_data || {},
                position: node.position,
                width:
                  (node.dimensions?.width ||
                    nodeTypes.find((n) => n.type === node.node_type)?.dimensions
                      ?.minWidth) ??
                  100,
                height:
                  (node.dimensions?.height ||
                    nodeTypes.find((n) => n.type === node.node_type)?.dimensions
                      ?.minHeight) ??
                  100,
              })),
            }
          );

          createdNodeIds.push(...newNodeIds);
        }
      }

      // Handle EDIT operations
      const nodesToEdit = nodes.filter((n) => n.operation === "edit");
      if (nodesToEdit.length > 0) {
        const missingIds = nodesToEdit.filter((n) => !n.node_id);
        if (missingIds.length > 0) {
          errors.push(
            `${missingIds.length} node(s) missing required node_id for edit operation.`
          );
        }

        const validNodesToEdit = nodesToEdit.filter((n) => n.node_id);

        // Valider les données si un nouveau type est fourni
        for (const node of validNodesToEdit) {
          if (node.node_type && node.node_data) {
            const validation = validateNodeData(
              node.node_type,
              node.node_data as Record<string, unknown>
            );
            if (!validation.isValid) {
              const nodeName = node.name || node.node_id!;
              errors.push(`Node "${nodeName}" validation failed`);
              detailedValidationErrors.push(
                `Node: ${nodeName}\n` +
                  `Errors: ${validation.errors.join("; ")}\n` +
                  `Expected format: ${JSON.stringify(validation.expectedFormat, null, 2)}`
              );
              continue;
            }
          }

          try {
            await ctx.runMutation(
              internal.ia.helpers.canvasHelpers.editNodeInCanvasInternal,
              {
                canvasId: canvas_id as Id<"canvases">,
                nodeId: node.node_id!,
                updates: {
                  ...(node.name && { name: node.name }),
                  ...(node.node_type && { type: node.node_type }),
                  ...(node.node_data && { data: node.node_data }),
                  ...(node.position && { position: node.position }),
                  ...(node.dimensions?.width && {
                    width: node.dimensions.width,
                  }),
                  ...(node.dimensions?.height && {
                    height: node.dimensions.height,
                  }),
                },
              }
            );
            editedNodeIds.push(node.node_id!);
          } catch (error: unknown) {
            errors.push(
              `Failed to edit node ${node.node_id}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      }

      const hasErrors = errors.length > 0;
      const hasSuccess = createdNodeIds.length > 0 || editedNodeIds.length > 0;
      const hasValidationErrors = detailedValidationErrors.length > 0;

      const summaryParts = [
        createdNodeIds.length > 0
          ? `Created ${createdNodeIds.length} node(s)`
          : null,
        editedNodeIds.length > 0
          ? `Edited ${editedNodeIds.length} node(s)`
          : null,
        errors.length > 0 ? `${errors.length} error(s)` : null,
      ].filter(Boolean);

      return {
        success: !hasErrors || hasSuccess,
        summary:
          summaryParts.length > 0
            ? summaryParts.join(", ")
            : "No operations performed",
        createdNodeIds,
        editedNodeIds,
        errors,
        validationErrors: hasValidationErrors
          ? detailedValidationErrors
          : undefined,
        hint: hasValidationErrors
          ? "Some nodes were rejected due to invalid data. Check validationErrors for details and expected format."
          : hasErrors
            ? "Check the errors array for details. Use readNodeConfigsTool to verify data structure."
            : "Nodes modified successfully. Use readCanvasTool to verify changes.",
      };
    } catch (error: unknown) {
      console.error("❌ editCanvasNodesAndEdgesTool error:", error);
      return {
        success: false,
        summary: "Operation failed",
        createdNodeIds: [],
        editedNodeIds: [],
        errors: [error instanceof Error ? error.message : String(error)],
        hint: "Check canvas_id validity and node data structure using readNodeConfigsTool.",
      };
    }
  },
});
