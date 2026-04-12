import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { getNodeDataTitle } from "../../lib/getNodeDataTitle";

export const getCanvasChangesSinceLastMessage = internalQuery({
  args: {
    canvasId: v.id("canvases"),
    lastMessageAt: v.number(),
  },
  returns: v.string(),
  handler: async (ctx, { canvasId, lastMessageAt }) => {
    const canvas = await ctx.db.get("canvases", canvasId);
    if (!canvas) return "";

    const changedNodes = await Promise.all(
      (canvas.nodes ?? []).map(async (node) => {
        if (!node.nodeDataId) return null;

        const nodeData = await ctx.db.get("nodeDatas", node.nodeDataId);
        if (!nodeData) return null;
        if (nodeData.updatedAt <= lastMessageAt) return null;

        return {
          id: node.id,
          type: node.type,
          title: getNodeDataTitle(nodeData),
        };
      }),
    );

    const xmlNodes = changedNodes.flatMap((node) =>
      node ? [`<node id="${node.id}"/>`] : [],
    );

    if (xmlNodes.length === 0) return "";

    return [
      "<modified_since_last_message>",
      "<description>The following nodes have been modified by the user since the last message. Those modifications can or cannot be relevant to the current context.</description>",
      ...xmlNodes,
      "</modified_since_last_message>",
    ].join("\n");
  },
});
