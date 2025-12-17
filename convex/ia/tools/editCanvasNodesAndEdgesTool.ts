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
    "**Before using this tool, you must use read_node_configs to get the correct data structure for the node type you want to create or edit.** Otherwise, the data you pass will be rejected. Edit nodes on a user canvas. This tool allows you to create, edit, or delete nodes on a specified canvas. ",
  args: z.object({
    canvas_id: z
      .string()
      .describe("ID of the canvas where the nodes will be modified."),
    nodes: z.array(
      z.object({
        operation: z
          .enum(["create", "edit", "delete"])
          .describe("The operation to perform on the node.")
          .default("create"),
        node_id: z
          .string()
          .describe(
            "ID of the node to edit or delete. Required for edit and delete operations, ignored for create."
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
      const results: {
        created: string[];
        edited: string[];
        deleted: string[];
        errors: string[];
        validationErrors?: {
          nodeName: string;
          errors: string[];
          expectedFormat?: object;
        }[];
      } = {
        created: [],
        edited: [],
        deleted: [],
        errors: [],
      };

      // Handle CREATE operations
      const nodesToCreate = nodes.filter((n) => n.operation === "create");
      if (nodesToCreate.length > 0) {
        const missingTypes = nodesToCreate.filter((n) => !n.node_type);
        if (missingTypes.length > 0) {
          results.errors.push(
            `${missingTypes.length} node(s) missing required node_type for create operation.`
          );
        }

        const validNodesToCreate = nodesToCreate.filter((n) => n.node_type);

        // Validate node data against expected schema
        const validationResults: {
          node: (typeof validNodesToCreate)[0];
          validation: ValidationResult;
        }[] = [];
        const invalidNodes: {
          nodeName: string;
          errors: string[];
          expectedFormat?: object;
        }[] = [];

        for (const node of validNodesToCreate) {
          const validation = validateNodeData(
            node.node_type!,
            node.node_data as Record<string, unknown>
          );
          if (!validation.isValid) {
            invalidNodes.push({
              nodeName: node.name || node.node_type!,
              errors: validation.errors,
              expectedFormat: validation.expectedFormat,
            });
          } else {
            validationResults.push({ node, validation });
          }
        }

        // Report validation errors
        if (invalidNodes.length > 0) {
          for (const invalid of invalidNodes) {
            results.errors.push(
              `Node "${invalid.nodeName}" has invalid data: ${invalid.errors.join(" ")}`
            );
          }
          // Add expected formats to help the model correct the data
          results.validationErrors = invalidNodes.map((inv) => ({
            nodeName: inv.nodeName,
            errors: inv.errors,
            expectedFormat: inv.expectedFormat,
          }));
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

          results.created = newNodeIds;
        }
      }

      // Handle EDIT operations
      const nodesToEdit = nodes.filter((n) => n.operation === "edit");
      if (nodesToEdit.length > 0) {
        const missingIds = nodesToEdit.filter((n) => !n.node_id);
        if (missingIds.length > 0) {
          results.errors.push(
            `${missingIds.length} node(s) missing required node_id for edit operation.`
          );
        }
        // TODO: Implement edit logic when canvasHelpers supports it
        results.errors.push("Edit operation not yet implemented.");
      }

      // Handle DELETE operations
      const nodesToDelete = nodes.filter((n) => n.operation === "delete");
      if (nodesToDelete.length > 0) {
        const missingIds = nodesToDelete.filter((n) => !n.node_id);
        if (missingIds.length > 0) {
          results.errors.push(
            `${missingIds.length} node(s) missing required node_id for delete operation.`
          );
        }
        // TODO: Implement delete logic when canvasHelpers supports it
        results.errors.push("Delete operation not yet implemented.");
      }

      const hasErrors = results.errors.length > 0;
      const hasSuccess =
        results.created.length > 0 ||
        results.edited.length > 0 ||
        results.deleted.length > 0;

      const hasValidationErrors = (results.validationErrors?.length ?? 0) > 0;

      return {
        success: !hasErrors || hasSuccess,
        summary: [
          results.created.length > 0
            ? `Created ${results.created.length} node(s)`
            : null,
          results.edited.length > 0
            ? `Edited ${results.edited.length} node(s)`
            : null,
          results.deleted.length > 0
            ? `Deleted ${results.deleted.length} node(s)`
            : null,
          results.errors.length > 0
            ? `${results.errors.length} error(s)`
            : null,
        ]
          .filter(Boolean)
          .join(", "),
        results,
        hint: hasValidationErrors
          ? "Some nodes were rejected due to invalid data. Check validationErrors for the expected format and correct your data structure."
          : hasErrors
            ? "Check the errors array for details. Use readNodeConfigsTool to verify data structure."
            : "Nodes modified successfully. Use readCanvasTool to verify changes.",
      };
    } catch (error: unknown) {
      console.error("❌ editCanvasNodesAndEdgesTool error:", error);
      return {
        success: false,
        summary: "Operation failed",
        error: error instanceof Error ? error.message : String(error),
        hint: "Check canvas_id validity and node data structure using readNodeConfigsTool.",
      };
    }
  },
});
