import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

export const readCanvasTool = createTool({
  description:
    "Allow to read the whole canvas object, from a canvas ID. Returns the complete canvas object including the canvas data, and the belonging nodes and edges.",
  args: z.object({
    canvasId: z.string().describe("ID of the canvas to read."),
    scope: z
      .array(
        z.enum(["entireCanvas", "nodesOnly", "edgesOnly", "canvasDataOnly"])
      )
      .describe(
        "Scope of the canvas to read, specifying which parts to include.\n`entireCanvas` returns all data (canvas data, nodes, edges, and metadata). `canvasDataOnly` returns only the canvas metadata and properties (name, sharing) without nodes and edges."
      ),
  }),
  handler: async (ctx, { canvasId, scope }): Promise<string> => {
    console.log(`🔍 Read canvas: ${canvasId} | Scope: ${scope.join(", ")}`);

    try {
      // Get the canvas from the db
      const result = await ctx.runQuery(api.canvases.getCanvas, {
        canvasId: canvasId as Id<"canvases">,
      });

      if (!result || !result.success || !result.canvas) {
        return `Canvas not found or access denied for ID: ${canvasId}`;
      }

      const canvas = result.canvas;

      // Return the object depending on the scope
      if (scope.includes("canvasDataOnly")) {
        const canvasData = {
          _id: canvas._id,
          _creationTime: canvas._creationTime,
          name: canvas.name,
          icon: canvas.icon,
          description: canvas.description,
          sharingOptions: canvas.sharingOptions,
          creatorId: canvas.creatorId,
          updatedAt: canvas.updatedAt,
        };
        return JSON.stringify(canvasData, null, 2);
      }

      if (scope.includes("nodesOnly")) {
        return JSON.stringify({ nodes: canvas.nodes }, null, 2);
      }

      if (scope.includes("edgesOnly")) {
        return JSON.stringify({ edges: canvas.edges }, null, 2);
      }

      // Default: entireCanvas
      return JSON.stringify(canvas, null, 2);
    } catch (error) {
      console.error("Read canvas error:", error);
      return `Read canvas failed: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the canvas ID and try again.`;
    }
  },
});
