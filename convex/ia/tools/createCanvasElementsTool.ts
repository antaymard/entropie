import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { api, internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

export const createCanvasElementsTool = createTool({
  description:
    "Create nodes on a user canvas. This tool allows you to create new nodes on a specified canvas using provided node data in JSON format. The node data should include all necessary properties.",
  args: z.object({
    canvasId: z
      .string()
      .describe("ID of the canvas where to create the nodes."),
    nodesToCreate: z
      .array(
        z.object({
          name: z
            .string()
            .describe("Name of the node. Displayed on the node's header."),
          type: z.enum(["document", "link", "image"])
            .describe(`Type of the node. Determines its content and behavior.
                - "document": A platejs editor based node
                - "link": A web link node
                - "image": An image node`),
          position: z.object({
            x: z.number().describe("X coordinate of the node position."),
            y: z.number().describe("Y coordinate of the node position."),
          }),
        })
      )
      .describe("Array of node objects to create on the canvas."),
  }),
  handler: async (ctx, { canvasId, nodesToCreate }): Promise<string> => {
    try {
      console.log(ctx);

      // Check if userId is available in the agent context
      if (!ctx.userId) {
        return "User not authenticated. Cannot create nodes on canvas.";
      }

      // Get the canvas from the db using internal query
      const canvas = await ctx.runQuery(
        internal.ia.tools.readCanvasTool.getCanvasInternal,
        {
          canvasId: canvasId as Id<"canvases">,
        }
      );

      if (!canvas) {
        return `Failed to retrieve canvas with ID ${canvasId}. Please verify the canvas ID and try again.`;
      }

      // Create the new nodes
      const newNodes = nodesToCreate.map((nodeData) => {
        const newNodeId = `node-${crypto.randomUUID()}`;

        return {
          id: newNodeId,
          name: nodeData.name,
          type: nodeData.type,
          position: nodeData.position,
          width: 100,
          height: 100,
          data: {},
        };
      });

      // Combine existing nodes with new nodes
      const updatedNodes = [...canvas.nodes, ...newNodes];

      // Update the canvas with the new nodes
      await ctx.runMutation(internal.canvases.updateCanvasContentInternal, {
        canvasId: canvasId as Id<"canvases">,
        nodes: updatedNodes,
        edges: canvas.edges,
      });

      const nodeDetails = newNodes
        .map((n) => `"${n.name}" (ID: ${n.id})`)
        .join(", ");
      return `Successfully created ${newNodes.length} node(s) on the canvas: ${nodeDetails}`;
    } catch (error) {
      console.error("Create canvas nodes error:", error);
      return `Failed to create nodes: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the canvas ID and node data.`;
    }
  },
});
