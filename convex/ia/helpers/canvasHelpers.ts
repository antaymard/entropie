import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import { markdownToPlateJson } from "./markdownToPlateHelper";
import { plateJsonToMarkdown } from "./plateToMarkdownHelper";

export const getCanvasInternal = internalQuery({
  args: {
    canvasId: v.id("canvases"),
  },
  returns: v.any(),
  handler: async (ctx, { canvasId }) => {
    const canvas = await ctx.db.get(canvasId);
    if (!canvas) return null;

    // Convertir les nodes de type "document" en markdown pour le LLM
    const processedNodes = (canvas.nodes || []).map((node: any) => {
      if (node.type === "document" && node.data?.doc) {
        // Si doc est un array (format Plate.js JSON), on le convertit en markdown
        if (Array.isArray(node.data.doc)) {
          const markdown = plateJsonToMarkdown(node.data.doc);
          return {
            ...node,
            data: {
              ...node.data,
              doc: markdown,
            },
          };
        }
      }
      return node;
    });

    return {
      ...canvas,
      nodes: processedNodes,
    };
  },
});

export const addNodesToCanvasInternal = internalMutation({
  args: {
    canvasId: v.id("canvases"),
    newNodes: v.array(v.any()),
  },
  handler: async (ctx, { canvasId, newNodes }) => {
    try {
      const canvas = await ctx.db.get(canvasId);
      if (!canvas) {
        throw new Error(`Canvas with ID ${canvasId} not found.`);
      }

      // Convertir le markdown en format Plate.js JSON pour les nodes de type "document"
      const processedNodes = newNodes.map((node) => {
        if (node.type === "document" && node.data?.doc) {
          // Si doc est une string (markdown), on la convertit en format Plate.js JSON
          if (typeof node.data.doc === "string") {
            const plateJson = markdownToPlateJson(node.data.doc);
            return {
              ...node,
              data: {
                ...node.data,
                doc: plateJson,
              },
            };
          }
        }
        return node;
      });

      const updatedNodes = [...(canvas.nodes || []), ...processedNodes];
      await ctx.db.patch(canvasId, { nodes: updatedNodes });

      return `Successfully added ${processedNodes.length} nodes to canvas ${canvasId}.`;
    } catch (error) {
      console.error("❌ Add nodes to canvas error:", error);
      throw new Error(
        `Adding nodes to canvas failed: ${error}. Please try again.`
      );
    }
  },
});
