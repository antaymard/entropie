import { dynamicTool } from "ai";
import { internal } from "../../_generated/api";
import { type Id } from "../../_generated/dataModel";
import { type ActionCtx } from "../../_generated/server";
import z from "zod";

export default function writeEdgeDynamicTool({
  ctx,
  canvasId,
}: {
  ctx: ActionCtx;
  canvasId: Id<"canvases">;
}) {
  const toolInputSchema = z.object({
    operation: z
      .enum(["create", "update", "delete"])
      .describe("Whether to create, update, or delete an edge."),
    sourceNodeId: z
      .string()
      .optional()
      .describe("The source node id in the canvas for create/update."),
    targetNodeId: z
      .string()
      .optional()
      .describe("The target node id in the canvas for create/update."),
    edgeId: z
      .string()
      .optional()
      .describe("The edge id. Required for update/delete."),
  });

  return dynamicTool({
    description:
      "Tool for creating, updating, or deleting an edge in a canvas.",
    inputSchema: toolInputSchema,
    execute: async (args) => {
      try {
        const parsedArgs = toolInputSchema.parse(args);

        if (parsedArgs.operation === "create") {
          if (!parsedArgs.sourceNodeId || !parsedArgs.targetNodeId) {
            return "Create operation requires sourceNodeId and targetNodeId.";
          }

          const newEdgeId = parsedArgs.edgeId ?? crypto.randomUUID();

          await ctx.runMutation(internal.wrappers.canvasEdgeWrappers.add, {
            canvasId,
            edges: [
              {
                id: newEdgeId,
                source: parsedArgs.sourceNodeId,
                target: parsedArgs.targetNodeId,
              },
            ],
          });

          return {
            success: true,
            operation: "create",
            edgeId: newEdgeId,
            sourceNodeId: parsedArgs.sourceNodeId,
            targetNodeId: parsedArgs.targetNodeId,
          };
        }

        if (parsedArgs.operation === "update") {
          if (!parsedArgs.edgeId) {
            return "Update operation requires edgeId.";
          }
          if (!parsedArgs.sourceNodeId || !parsedArgs.targetNodeId) {
            return "Update operation requires sourceNodeId and targetNodeId.";
          }

          await ctx.runMutation(internal.wrappers.canvasEdgeWrappers.remove, {
            canvasId,
            edgeIds: [parsedArgs.edgeId],
          });

          await ctx.runMutation(internal.wrappers.canvasEdgeWrappers.add, {
            canvasId,
            edges: [
              {
                id: parsedArgs.edgeId,
                source: parsedArgs.sourceNodeId,
                target: parsedArgs.targetNodeId,
              },
            ],
          });

          return {
            success: true,
            operation: "update",
            edgeId: parsedArgs.edgeId,
            sourceNodeId: parsedArgs.sourceNodeId,
            targetNodeId: parsedArgs.targetNodeId,
          };
        }

        if (!parsedArgs.edgeId) {
          return "Delete operation requires edgeId.";
        }

        await ctx.runMutation(internal.wrappers.canvasEdgeWrappers.remove, {
          canvasId,
          edgeIds: [parsedArgs.edgeId],
        });

        return {
          success: true,
          operation: "delete",
          edgeId: parsedArgs.edgeId,
        };
      } catch (error) {
        return `Error while writing edge data: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
}
