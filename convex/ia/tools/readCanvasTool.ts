import { createTool } from "@convex-dev/agent";
import type { FunctionReference } from "convex/server";
import { z } from "zod";
import { Id } from "../../_generated/dataModel";

type CanvasReadRef = FunctionReference<
  "query",
  "public" | "internal",
  { canvasId: Id<"canvases"> },
  unknown
>;

type CanvasReadResult = {
  _id: string;
  _creationTime: number;
  name: string;
  creatorId: string;
  updatedAt: number;
  nodes?: unknown[];
  edges?: unknown[];
};

export function createReadCanvasTool({
  getCanvasInternal,
}: {
  getCanvasInternal: CanvasReadRef;
}) {
  return createTool({
    description:
      "Allow to read a whole canvas object, from a canvas ID. Returns the complete canvas object including the canvas data, and the nodes and edges. This is token-expensive, so use with caution.",
    args: z.object({
      canvasId: z.string().describe("ID of the canvas to read."),
      scope: z
        .array(
          z.enum(["entireCanvas", "nodesOnly", "edgesOnly", "canvasDataOnly"]),
        )
        .describe(
          "Scope of the canvas to read, specifying which parts to include.\n`entireCanvas` returns all data (canvas data, nodes, edges, and metadata). `canvasDataOnly` returns only the canvas metadata and properties (name, sharing) without nodes and edges.",
        ),
    }),
    handler: async (ctx, { canvasId, scope }): Promise<string> => {
      console.log(`🔍 Read canvas: ${canvasId} | Scope: ${scope.join(", ")}`);

      try {
        const canvas = (await ctx.runQuery(getCanvasInternal, {
          canvasId: canvasId as Id<"canvases">,
        })) as CanvasReadResult | null;

        if (!canvas) {
          return `Canvas not found for ID: ${canvasId}`;
        }

        if (scope.includes("canvasDataOnly")) {
          const canvasData = {
            _id: canvas._id,
            _creationTime: canvas._creationTime,
            name: canvas.name,
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

        return JSON.stringify(canvas, null, 2);
      } catch (error) {
        console.error("Read canvas error:", error);
        return `Read canvas failed: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the canvas ID and try again.`;
      }
    },
  });
}
