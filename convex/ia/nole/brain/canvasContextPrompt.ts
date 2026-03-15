import { v } from "convex/values";
import { internalQuery } from "../../../_generated/server";
import { type CanvasNode } from "../../../schemas/canvasesSchema";
import { encode } from "@toon-format/toon";

type CanvasNodeWithData = Omit<CanvasNode, "id" | "nodeDataId"> & {
  idOnCanvas: string;
  nodeData: Record<string, unknown> | null;
};

export const canvasContextPrompt = internalQuery({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    const canvas = await ctx.db.get(canvasId);

    if (!canvas) {
      return "No canvas found.";
    }

    // For each node, fetch its nodeData
    const nodesWithData: CanvasNodeWithData[] = await Promise.all(
      (canvas.nodes || []).map(async (node) => {
        let nodeData = null;
        if (node.nodeDataId) {
          nodeData = await ctx.db.get(node.nodeDataId);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: idOnCanvas, nodeDataId, ...restCanvasNode } = node;
        return {
          idOnCanvas,
          ...restCanvasNode,
          nodeData,
        };
      }),
    );

    return `
    ## Current canvas context

    Here is the canvas that the user is currently working on:

    - Canvas ID: ${canvas._id}
    - Canvas title: ${canvas?.name ?? "Untitled"}
    - Number of nodes: ${canvas.nodes?.length ?? 0}
    - Number of edges: ${canvas.edges?.length ?? 0}

    ### Nodes summary
    ${generateNodeSummmary(nodesWithData)}

    ### To know more
    If you want to know more about the canvas or its nodes, you can use the provided tools: 
    - canvasTool('your query here in natural language') 
    - nodeTool('your query here in natural language'). 

    Give the tools the necessary information to retrieve the relevant data (nodeId, canvasId...). Those tools can also be used to update the canvas or its nodes, again, in a natural language way. 
    `;
  },
});

function generateNodeSummmary(nodes: CanvasNodeWithData[]): string {
  const formattedNodes = nodes.map((node) => {
    return {
      idOnCanvas: node.idOnCanvas,
      type: node.type,
      positionOnCanvas: JSON.stringify(node.position),
      abstract:
        node.type === "floatingText"
          ? JSON.stringify(node.data)
          : (node.nodeData?.abstract ?? "No abstract"),
      updatedAt:
        node.nodeData?.updatedAt && typeof node.nodeData.updatedAt === "number"
          ? new Date(node.nodeData.updatedAt).toISOString()
          : "No update time",
    };
  });

  const response = encode(formattedNodes);
  return response;
}
