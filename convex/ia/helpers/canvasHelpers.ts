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

export const editNodeInCanvasInternal = internalMutation({
  args: {
    canvasId: v.id("canvases"),
    nodeId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      type: v.optional(v.string()),
      data: v.optional(v.any()),
      position: v.optional(v.object({ x: v.number(), y: v.number() })),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
    }),
  },
  returns: v.string(),
  handler: async (ctx, { canvasId, nodeId, updates }) => {
    try {
      const canvas = await ctx.db.get(canvasId);
      if (!canvas) {
        throw new Error(`Canvas with ID ${canvasId} not found.`);
      }

      const nodeIndex = (canvas.nodes || []).findIndex(
        (node: any) => node.id === nodeId
      );

      if (nodeIndex === -1) {
        throw new Error(`Node with ID ${nodeId} not found in canvas.`);
      }

      const existingNode = canvas.nodes![nodeIndex];
      const updatedNode = { ...existingNode };

      // Mettre à jour les propriétés si elles sont fournies
      if (updates.name !== undefined) updatedNode.name = updates.name;
      if (updates.type !== undefined) updatedNode.type = updates.type;
      if (updates.position !== undefined)
        updatedNode.position = updates.position;
      if (updates.width !== undefined) updatedNode.width = updates.width;
      if (updates.height !== undefined) updatedNode.height = updates.height;

      // Gérer les données avec conversion markdown/Plate.js si nécessaire
      if (updates.data !== undefined) {
        const nodeType = updates.type || existingNode.type;
        if (nodeType === "document" && updates.data?.doc) {
          // Si doc est une string (markdown), on la convertit en format Plate.js JSON
          if (typeof updates.data.doc === "string") {
            const plateJson = markdownToPlateJson(updates.data.doc);
            updatedNode.data = {
              ...existingNode.data,
              ...updates.data,
              doc: plateJson,
            };
          } else {
            updatedNode.data = { ...existingNode.data, ...updates.data };
          }
        } else {
          updatedNode.data = { ...existingNode.data, ...updates.data };
        }
      }

      // Créer un nouveau tableau de nodes avec le node mis à jour
      const updatedNodes = [...canvas.nodes!];
      updatedNodes[nodeIndex] = updatedNode;

      await ctx.db.patch(canvasId, { nodes: updatedNodes });

      return `Successfully edited node ${nodeId} in canvas ${canvasId}.`;
    } catch (error) {
      console.error("❌ Edit node in canvas error:", error);
      throw new Error(
        `Editing node in canvas failed: ${error}. Please try again.`
      );
    }
  },
});
