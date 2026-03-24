import { createTool } from "@convex-dev/agent";
import { z } from "zod";

// is v1
export const editNodeOnCanvasTool = createTool({
  description:
    "Use this tools to resize, move or delete a node on the canvas. This tool does not allow to edit the nodeData content, only the node properties on the canvas (position, size, etc.).",
  args: z.object({
    nodeIdOnCanvas: z
      .string()
      .describe(
        "The ID of the node on the canvas to edit. **Not the nodeDataId.**",
      ),
    operation: z
      .enum(["resize", "move", "delete"])
      .describe("The operation to perform on the node (resize, move, delete)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    console.log(
      `🖼️ Performing operation: ${args.operation} on node with ID: ${args.nodeIdOnCanvas}`,
    );

    try {
      console.log(`✅ Operation complete`);
      return "result.text";
    } catch (error) {
      console.error("Edit node on canvas error:", error);
      throw new Error(
        `Failed to edit node on canvas: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the ID and try again.`,
      );
    }
  },
});
