import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

export const getCanvasInternal = internalQuery({
  args: {
    canvasId: v.id("canvases"),
  },
  returns: v.any(),
  handler: async (ctx, { canvasId }) => {
    const canvas = await ctx.db.get(canvasId);
    return canvas;
  },
});

export const readCanvasTool = createTool({
  description:
    "Allow to read a whole canvas object, from a canvas ID. Returns the complete canvas object including the canvas data, and the belonging nodes and edges. This is token-expensive, so use with caution.",
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
      // Get the canvas from the db (internal query without auth)
      const canvas = await ctx.runQuery(
        internal.ia.tools.readCanvasTool.getCanvasInternal,
        {
          canvasId: canvasId as Id<"canvases">,
        }
      );

      if (!canvas) {
        return `Canvas not found for ID: ${canvasId}`;
      }

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
