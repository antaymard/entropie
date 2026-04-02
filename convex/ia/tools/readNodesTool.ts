import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { getNodeDataTitle } from "../../lib/getNodeDataTitle";
import { escapeXmlAttribute, toXmlCdata } from "../../lib/xml";
import { makeNodeDataLLMFriendly } from "../helpers/makeNodeDataLLMFriendly";
import type { NoleToolRuntimeContext } from "../noleToolRuntimeContext";

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
            };
          }),
        );

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
            }) =>
              `<node id="${escapeXmlAttribute(nodeId)}" type="${escapeXmlAttribute(nodeType)}"${withPosition ? ` x=${escapeXmlAttribute(String(positionX))} y=${escapeXmlAttribute(String(positionY))}${width !== null ? ` width=${escapeXmlAttribute(String(width))}` : "?"}${height !== null ? ` height=${escapeXmlAttribute(String(height))}` : "?"}` : ""} title="${escapeXmlAttribute(title)}">
${toXmlCdata(content)}
</node>`,
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
