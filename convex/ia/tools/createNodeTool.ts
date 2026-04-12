import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { generateLlmId } from "../../lib/llmId";
import { markdownToPlateJson } from "../helpers/plateMarkdownConverter";
import { stringifyPlateDocumentForStorage } from "../../lib/plateDocumentStorage";
import {
  getDefaultNodeDataValues,
  nodeDataConfig,
  nodeTypeZodValidator,
} from "../../config/nodeConfig";

const nodeColorValues = [
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "transparent",
  "pink",
  "orange",
  "default",
] as const;

type NodeRect = {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
};

type Side = "l" | "r" | "t" | "b";

function getSidePoint(rect: NodeRect, side: Side): { x: number; y: number } {
  const centerX = rect.position.x + rect.width / 2;
  const centerY = rect.position.y + rect.height / 2;

  switch (side) {
    case "l":
      return { x: rect.position.x, y: centerY };
    case "r":
      return { x: rect.position.x + rect.width, y: centerY };
    case "t":
      return { x: centerX, y: rect.position.y };
    case "b":
      return { x: centerX, y: rect.position.y + rect.height };
  }
}

function distanceSquared(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function getClosestHandlesForDirectedEdge({
  from,
  to,
}: {
  from: NodeRect;
  to: NodeRect;
}): {
  sourceHandle: string;
  targetHandle: string;
} {
  const sides: Side[] = ["l", "r", "t", "b"];

  let best:
    | {
        sourceSide: Side;
        targetSide: Side;
        distance: number;
      }
    | undefined;

  for (const sourceSide of sides) {
    for (const targetSide of sides) {
      const sourcePoint = getSidePoint(from, sourceSide);
      const targetPoint = getSidePoint(to, targetSide);
      const d2 = distanceSquared(sourcePoint, targetPoint);

      if (!best || d2 < best.distance) {
        best = {
          sourceSide,
          targetSide,
          distance: d2,
        };
      }
    }
  }

  const sourceSide = best?.sourceSide ?? "r";
  const targetSide = best?.targetSide ?? "l";

  return {
    sourceHandle: `${from.id}_s${sourceSide}`,
    targetHandle: `${to.id}_t${targetSide}`,
  };
}

function applyNodeDataTitle({
  nodeType,
  defaultValues,
  nodeTitle,
}: {
  nodeType: z.infer<typeof nodeTypeZodValidator>;
  defaultValues: Record<string, unknown>;
  nodeTitle?: string;
}): { values: Record<string, unknown>; titleApplied: boolean } {
  const title = nodeTitle?.trim();
  if (!title) {
    return { values: defaultValues, titleApplied: false };
  }

  switch (nodeType) {
    case "document": {
      return {
        values: {
          ...defaultValues,
          doc: stringifyPlateDocumentForStorage(
            markdownToPlateJson(`# ${title}`),
          ),
        },
        titleApplied: true,
      };
    }

    case "link": {
      const link =
        typeof defaultValues.link === "object" && defaultValues.link !== null
          ? (defaultValues.link as Record<string, unknown>)
          : {};

      return {
        values: {
          ...defaultValues,
          link: {
            ...link,
            pageTitle: title,
          },
        },
        titleApplied: true,
      };
    }

    case "embed": {
      const embed =
        typeof defaultValues.embed === "object" && defaultValues.embed !== null
          ? (defaultValues.embed as Record<string, unknown>)
          : {};

      return {
        values: {
          ...defaultValues,
          embed: {
            ...embed,
            title,
          },
        },
        titleApplied: true,
      };
    }

    case "value": {
      const value =
        typeof defaultValues.value === "object" && defaultValues.value !== null
          ? (defaultValues.value as Record<string, unknown>)
          : {};

      return {
        values: {
          ...defaultValues,
          value: {
            ...value,
            label: title,
          },
        },
        titleApplied: true,
      };
    }

    case "floatingText": {
      return {
        values: {
          ...defaultValues,
          text: title,
        },
        titleApplied: true,
      };
    }

    case "table": {
      return {
        values: {
          ...defaultValues,
          title,
        },
        titleApplied: true,
      };
    }

    default:
      return { values: defaultValues, titleApplied: false };
  }
}

export default function createNodeTool({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  return createTool({
    description:
      "Create an empty node you can then populate with data or manipulate using other tools.",
    args: z.object({
      nodeType: nodeTypeZodValidator.describe("Type of the node."),
      position: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .describe("Position x/y of the node on the canvas."),
      color: z.enum(nodeColorValues).describe("Color of the node."),
      dimensions: z
        .object({
          width: z.number(),
          height: z.number(),
        })
        .optional()
        .describe(
          "Dimensions width/height of the node. Default values will be used if not provided.",
        ),
      nodeTitle: z
        .string()
        .optional()
        .describe(
          "Optional node data title. Applied to title-like fields depending on node type.",
        ),
      sourceNodes: z
        .array(z.string())
        .optional()
        .describe(
          "Optional list of existing nodeIds to connect FROM each source node TO the newly created node.",
        ),
    }),
    handler: async (ctx, args) => {
      try {
        const nodeConfig = nodeDataConfig.find(
          (item) => item.type === args.nodeType,
        );
        if (!nodeConfig) {
          return `Error: unsupported nodeType ${args.nodeType}.`;
        }

        const defaultValues = getDefaultNodeDataValues(args.nodeType);
        if (!defaultValues) {
          return `Error: unsupported nodeType ${args.nodeType}.`;
        }

        if (typeof defaultValues !== "object" || defaultValues === null) {
          return `Error: invalid default values for nodeType ${args.nodeType}.`;
        }

        const defaultValuesRecord = defaultValues as Record<string, unknown>;

        const resolvedDimensions =
          args.dimensions ?? nodeConfig.defaultDimensions;

        const { values: initialValues, titleApplied } = applyNodeDataTitle({
          nodeType: args.nodeType,
          defaultValues: defaultValuesRecord,
          nodeTitle: args.nodeTitle,
        });

        const nodeDataId = await ctx.runMutation(
          internal.wrappers.nodeDataWrappers.create,
          {
            type: args.nodeType,
            values: initialValues,
            canvasId,
          },
        );

        const nodeId = generateLlmId();

        await ctx.runMutation(internal.wrappers.canvasNodeWrappers.add, {
          canvasId,
          canvasNodes: [
            {
              id: nodeId,
              nodeDataId,
              type: args.nodeType,
              position: args.position,
              width: resolvedDimensions.width,
              height: resolvedDimensions.height,
              color: args.color,
            },
          ],
        });

        const createdEdges: Array<{
          id: string;
          source: string;
          target: string;
          sourceHandle: string;
          targetHandle: string;
        }> = [];

        if (args.sourceNodes && args.sourceNodes.length > 0) {
          const toRect: NodeRect = {
            id: nodeId,
            position: args.position,
            width: resolvedDimensions.width,
            height: resolvedDimensions.height,
          };

          for (const sourceNodeId of args.sourceNodes) {
            if (sourceNodeId === nodeId) {
              return "Error: sourceNodes cannot contain the newly created node itself.";
            }

            const fromNodeLookup = await ctx.runQuery(
              internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
              {
                canvasId,
                nodeId: sourceNodeId,
              },
            );

            const fromRect: NodeRect = {
              id: fromNodeLookup.node.id,
              position: fromNodeLookup.node.position,
              width: fromNodeLookup.node.width,
              height: fromNodeLookup.node.height,
            };

            const { sourceHandle, targetHandle } =
              getClosestHandlesForDirectedEdge({
                from: fromRect,
                to: toRect,
              });

            const edgeId = generateLlmId();

            await ctx.runMutation(internal.wrappers.canvasEdgeWrappers.add, {
              canvasId,
              edges: [
                {
                  id: edgeId,
                  source: sourceNodeId,
                  target: nodeId,
                  sourceHandle,
                  targetHandle,
                },
              ],
            });

            createdEdges.push({
              id: edgeId,
              source: sourceNodeId,
              target: nodeId,
              sourceHandle,
              targetHandle,
            });
          }
        }

        const currentNodeData =
          args.nodeType === "document"
            ? { doc: args.nodeTitle?.trim() ? `# ${args.nodeTitle.trim()}` : "" }
            : initialValues;

        return {
          success: true,
          nodeId,
          nodeType: args.nodeType,
          titleApplied,
          position: args.position,
          color: args.color,
          dimensions: {
            width: resolvedDimensions.width,
            height: resolvedDimensions.height,
          },
          currentNodeData,
          createdEdges,
        };
      } catch (error) {
        return `Error while creating node: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
}
