import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { getNodeDataTitle } from "../../lib/getNodeDataTitle";
import { toXmlCdata } from "../../lib/xml";
import { makeNodeDataLLMFriendly } from "../helpers/makeNodeDataLLMFriendly";
import type { NoleToolRuntimeContext } from "../noleToolRuntimeContext";
import { nodeDataConfig } from "../../config/nodeConfig";

function isSchemaEligibleType(nodeType: string): boolean {
  return nodeType !== "document" && nodeType !== "table";
}

function getExpectedNodeDataSchemaString(nodeType: string): string | null {
  if (nodeType === "document" || nodeType === "table") {
    return null;
  }

  const config = nodeDataConfig.find((item) => item.type === nodeType);
  if (!config) {
    return null;
  }

  const schema = config.toolInputSchema ?? config.dataValuesSchema;

  try {
    const zodWithJson = z as unknown as {
      toJSONSchema?: (input: z.ZodTypeAny) => unknown;
    };

    if (typeof zodWithJson.toJSONSchema === "function") {
      return JSON.stringify(zodWithJson.toJSONSchema(schema), null, 2);
    }
  } catch {
    // Ignore serialization failures and fallback below.
  }

  return "Schema JSON serialization is unavailable.";
}

// is v1.0
export default function readNodesTool({
  canvasId,
}: Pick<NoleToolRuntimeContext, "canvasId">) {
  return createTool({
    description:
      "A tool to read multiple nodes from the current canvas and return their nodeData as LLM-friendly XML.",
    args: z.object({
      nodeIds: z
        .array(z.string())
        .min(1)
        .describe("The list of node IDs to read"),
      withPosition: z
        .boolean()
        .optional()
        .describe(
          "Whether to include x/y position and dimensions attributes in each node tag",
        ),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(
        `🖼️ Reading ${args.nodeIds.length} node(s) from canvas ${canvasId}`,
      );

      try {
        const withPosition = args.withPosition ?? true;
        const { nodes: canvasNodes, edges: canvasEdges } = await ctx.runQuery(
          internal.wrappers.canvasNodeWrappers.getCanvasNodesAndEdges,
          {
            canvasId: canvasId as Id<"canvases">,
          },
        );

        const requestedNodeIdSet = new Set(args.nodeIds);

        const nodes = await Promise.all(
          args.nodeIds.map(async (nodeId) => {
            const { node, nodeData } = await ctx.runQuery(
              internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
              {
                canvasId: canvasId as Id<"canvases">,
                nodeId,
              },
            );

            return {
              nodeId,
              nodeType: node.type,
              positionX: Math.trunc(node.position.x),
              positionY: Math.trunc(node.position.y),
              width:
                typeof node.width === "number" ? Math.trunc(node.width) : null,
              height:
                typeof node.height === "number"
                  ? Math.trunc(node.height)
                  : null,
              title: getNodeDataTitle(nodeData),
              content: makeNodeDataLLMFriendly(nodeData),
              hasData:
                typeof nodeData.values === "object" &&
                nodeData.values !== null &&
                Object.keys(nodeData.values).length > 0,
              expectedNodeDataSchema: getExpectedNodeDataSchemaString(
                node.type,
              ),
            };
          }),
        );

        const nodeInfoById = new Map<string, { type: string; title: string }>(
          nodes.map((node) => [
            node.nodeId,
            {
              type: node.nodeType,
              title: node.title,
            },
          ]),
        );

        const connectedNodeIdsToFetch = new Set<string>();
        for (const edge of canvasEdges) {
          if (requestedNodeIdSet.has(edge.source)) {
            connectedNodeIdsToFetch.add(edge.target);
          }
          if (requestedNodeIdSet.has(edge.target)) {
            connectedNodeIdsToFetch.add(edge.source);
          }
        }

        const missingNodeIds = [...connectedNodeIdsToFetch].filter(
          (nodeId) => !nodeInfoById.has(nodeId),
        );

        const canvasNodeTypeById = new Map(
          canvasNodes.map((node) => [node.id, node.type]),
        );

        await Promise.all(
          missingNodeIds.map(async (nodeId) => {
            const fallbackType = canvasNodeTypeById.get(nodeId) ?? "unknown";

            try {
              const { nodeData } = await ctx.runQuery(
                internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
                {
                  canvasId: canvasId as Id<"canvases">,
                  nodeId,
                },
              );

              nodeInfoById.set(nodeId, {
                type: fallbackType,
                title: getNodeDataTitle(nodeData),
              });
            } catch {
              nodeInfoById.set(nodeId, {
                type: fallbackType,
                title: "Untitled",
              });
            }
          }),
        );

        const formatConnection = (nodeId: string) => {
          const connectedNode = nodeInfoById.get(nodeId);
          const nodeType = connectedNode?.type ?? "unknown";
          const nodeTitle = connectedNode?.title ?? "Untitled";
          return `${nodeId} | ${nodeType} | ${nodeTitle}`;
        };

        const connectedFromByNodeId = new Map<string, Array<string>>();
        const connectedToByNodeId = new Map<string, Array<string>>();

        for (const edge of canvasEdges) {
          if (requestedNodeIdSet.has(edge.target)) {
            const values = connectedFromByNodeId.get(edge.target) ?? [];
            values.push(formatConnection(edge.source));
            connectedFromByNodeId.set(edge.target, values);
          }

          if (requestedNodeIdSet.has(edge.source)) {
            const values = connectedToByNodeId.get(edge.source) ?? [];
            values.push(formatConnection(edge.target));
            connectedToByNodeId.set(edge.source, values);
          }
        }

        const xml = [
          "<nodes>",
          ...nodes.map(
            ({
              nodeId,
              nodeType,
              positionX,
              positionY,
              width,
              height,
              title,
              content,
              hasData,
              expectedNodeDataSchema,
            }) => {
              const connectedFrom = connectedFromByNodeId.get(nodeId) ?? [];
              const connectedTo = connectedToByNodeId.get(nodeId) ?? [];

              const schemaStatus = !isSchemaEligibleType(nodeType)
                ? "not_applicable"
                : !hasData
                  ? "unavailable_no_data"
                  : expectedNodeDataSchema
                    ? "available"
                    : "unavailable";

              const schemaHint =
                schemaStatus === "unavailable_no_data"
                  ? "No schema available because this node currently has no data. Initialize it first."
                  : schemaStatus === "unavailable"
                    ? "No schema available for this node type."
                    : null;

              return `<node id="${nodeId}" type="${nodeType}" schemaStatus="${schemaStatus}" connectedFrom="${connectedFrom.join(" ; ")}" connectedTo="${connectedTo.join(" ; ")}"${withPosition ? ` x="${String(positionX)}" y="${String(positionY)}"${width !== null ? ` width="${String(width)}"` : "?"}${height !== null ? ` height="${String(height)}"` : "?"}` : ""} title="${title}">
${toXmlCdata(content)}
${expectedNodeDataSchema ? `<expectedNodeDataSchema>${toXmlCdata(expectedNodeDataSchema)}</expectedNodeDataSchema>` : ""}
${schemaHint ? `<schemaHint>${toXmlCdata(schemaHint)}</schemaHint>` : ""}
</node>`;
            },
          ),
          "</nodes>",
        ].join("\n");

        console.log("✅ Node read complete");
        return xml;
      } catch (error) {
        console.error("Read nodes error:", error);
        throw new Error(
          `Failed to read nodes: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the IDs and try again.`,
        );
      }
    },
  });
}
