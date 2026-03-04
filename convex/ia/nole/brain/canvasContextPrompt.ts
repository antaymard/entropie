import { v } from "convex/values";
import { internalQuery } from "../../../_generated/server";
import { type CanvasNode } from "../../../../schemas/canvasesSchema";
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
    



    `;
  },
});

function generateNodeSummmary(nodes: CanvasNodeWithData[]): string {
  let summary = "";

  return summary;
}
