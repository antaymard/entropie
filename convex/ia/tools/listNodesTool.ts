import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { getNodeDataTitle } from "../../lib/getNodeDataTitle";
import { escapeXmlAttribute } from "../../lib/xml";
import type { NoleToolRuntimeContext } from "../noleToolRuntimeContext";
import { nodeDataConfig } from "../../config/nodeConfig";

function isSchemaEligibleType(nodeType: string): boolean {
  return nodeType !== "document" && nodeType !== "table";
}

function hasNodeSchema(nodeType: string): boolean {
  return nodeDataConfig.some((config) => config.type === nodeType);
}

// is v1.0
export default function listNodesTool({
  canvasId,
}: Pick<NoleToolRuntimeContext, "canvasId">) {
  return createTool({
    description:
      "A tool to list and filter nodes from the current canvas. Returns a compact list of nodes (id, type, title, position) without their full content. Use read_nodes to get the full content of specific nodes after identifying them with this tool. All filters are combined with AND logic — call the tool multiple times to simulate OR. Results are capped at 20 nodes; if truncated, refine your filters to narrow down.",
    args: z.object({
      nodeTypes: z
        .array(z.string())
        .optional()
        .describe(
          "Filter by node types (e.g. ['document', 'image', 'table']). If omitted, all types are included.",
        ),
      connectedTo: z
        .object({
          nodeId: z.string().describe("The node ID to find connections for"),
          direction: z
            .enum(["input", "output", "both"])
            .describe(
              "input: nodes that connect TO this node (sources), output: nodes this node connects TO (targets), both: all connected nodes",
            ),
        })
        .optional()
        .describe("Filter nodes connected via an edge to the specified node"),
      area: z
        .object({
          x1: z.number(),
          y1: z.number(),
          x2: z.number(),
          y2: z.number(),
        })
        .optional()
        .describe(
          "Filter nodes whose position falls within the bounding box (x1,y1 = top-left corner, x2,y2 = bottom-right corner)",
        ),
      near: z
        .object({
          nodeId: z.string().describe("The reference node ID"),
        })
        .optional()
        .describe(
          "Filter nodes within 500 canvas units of the specified node's position",
        ),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`📋 Listing nodes from canvas ${canvasId}`);

      try {
        const { nodes: canvasNodes, edges: canvasEdges } = await ctx.runQuery(
          internal.wrappers.canvasNodeWrappers.getCanvasNodesAndEdges,
          {
            canvasId: canvasId as Id<"canvases">,
          },
        );

        const nodePosById = new Map(
          canvasNodes.map((n) => [n.id, { x: n.position.x, y: n.position.y }]),
        );

        // Resolve connected node IDs if connectedTo filter is set
        let connectedNodeIds: Set<string> | null = null;
        if (args.connectedTo) {
          const { nodeId, direction } = args.connectedTo;
          connectedNodeIds = new Set<string>();
          for (const edge of canvasEdges) {
            if (direction === "output" || direction === "both") {
              if (edge.source === nodeId) connectedNodeIds.add(edge.target);
            }
            if (direction === "input" || direction === "both") {
              if (edge.target === nodeId) connectedNodeIds.add(edge.source);
            }
          }
        }

        // Resolve near center position if set
        let nearCenter: { x: number; y: number } | null = null;
        if (args.near) {
          const pos = nodePosById.get(args.near.nodeId);
          if (!pos) {
            throw new Error(
              `Reference node "${args.near.nodeId}" not found on canvas`,
            );
          }
          nearCenter = pos;
        }

        // Apply filters
        const filteredNodes = canvasNodes.filter((node) => {
          if (args.nodeTypes && args.nodeTypes.length > 0) {
            if (!args.nodeTypes.includes(node.type)) return false;
          }

          if (connectedNodeIds !== null) {
            if (!connectedNodeIds.has(node.id)) return false;
          }

          if (args.area) {
            const { x1, y1, x2, y2 } = args.area;
            const nx = node.position.x;
            const ny = node.position.y;
            if (nx < x1 || nx > x2 || ny < y1 || ny > y2) return false;
          }

          if (args.near && nearCenter) {
            const dx = node.position.x - nearCenter.x;
            const dy = node.position.y - nearCenter.y;
            if (Math.sqrt(dx * dx + dy * dy) > 500) return false;
          }

          return true;
        });

        console.log(
          `📋 Found ${filteredNodes.length} node(s) matching filters`,
        );

        // Fetch titles for filtered nodes that have nodeData
        const nodeEntries = await Promise.all(
          filteredNodes.map(async (node) => {
            let title = "Untitled";
            if (node.nodeDataId) {
              try {
                const { nodeData } = await ctx.runQuery(
                  internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
                  {
                    canvasId: canvasId as Id<"canvases">,
                    nodeId: node.id,
                  },
                );
                title = getNodeDataTitle(nodeData);
              } catch {
                // keep "Untitled"
              }
            }
            return {
              id: node.id,
              type: node.type,
              title,
              x: Math.trunc(node.position.x),
              y: Math.trunc(node.position.y),
              schemaStatus: !isSchemaEligibleType(node.type)
                ? "not_applicable"
                : !node.nodeDataId
                  ? "unavailable_no_data"
                  : hasNodeSchema(node.type)
                    ? "available"
                    : "unavailable",
            };
          }),
        );

        if (nodeEntries.length === 0) {
          return "No nodes found matching the given filters.\n\nUse the read_nodes tool to read the full content of specific nodes.";
        }

        const limit = 20;
        const truncated = nodeEntries.length > limit;
        const displayedEntries = truncated
          ? nodeEntries.slice(0, limit)
          : nodeEntries;

        const xml = [
          `<nodes count="${displayedEntries.length}"${truncated ? ` truncated="true" total="${nodeEntries.length}"` : ""}>`,
          ...displayedEntries.map(
            ({ id, type, title, x, y, schemaStatus }) =>
              `  <node id=${escapeXmlAttribute(id)} type=${escapeXmlAttribute(type)} title=${escapeXmlAttribute(title)} x=${escapeXmlAttribute(String(x))} y=${escapeXmlAttribute(String(y))} schemaStatus=${escapeXmlAttribute(schemaStatus)} />`,
          ),
          "</nodes>",
          "",
          truncated
            ? `Results truncated to ${limit} of ${nodeEntries.length} matching nodes. Add or refine filters to narrow down results.`
            : "Use the read_nodes tool to read the full content of the relevant nodes identified above.",
        ].join("\n");

        console.log("✅ Node listing complete");
        return xml;
      } catch (error) {
        console.error("List nodes error:", error);
        throw new Error(
          `Failed to list nodes: ${error instanceof Error ? error.message : "Unknown error"}.`,
        );
      }
    },
  });
}
