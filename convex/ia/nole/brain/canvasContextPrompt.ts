import { v } from "convex/values";
import { internalAction } from "../../../_generated/server";
import { internal } from "../../../_generated/api";
import { encode } from "@toon-format/toon";
import type { Id } from "../../../_generated/dataModel";

// ── Types ───────────────────────────────────────────────────────────────

type CanvasData = {
  canvasId: Id<"canvases">;
  name: string;
  nodeCount: number;
  nodes: Array<{
    idOnCanvas: string;
    type: string;
    position: { x: number; y: number };
    nodeDataId: Id<"nodeDatas"> | null;
    abstract: string | null;
  }>;
  edges: Array<{
    source: string;
    target: string;
  }>;
};

export const create = internalAction({
  args: { canvasId: v.id("canvases") },
  returns: v.string(),
  handler: async (ctx, { canvasId }): Promise<string> => {
    console.log("🚧 Creating canvas context for canvasId:", canvasId);
    // 1. Récupérer les données du canvas pour extraire les nodeDataIds
    const canvasData = await ctx.runQuery(
      internal.ia.nole.brain.getCanvasNodeDatasWithAbstracts
        .getCanvasNodeDatasWithAbstracts,
      { canvasId },
    );
    if (!canvasData) return "No canvas found.";

    // 2. Générer / rafraîchir les abstracts (skip auto si déjà à jour)
    const nodeDataIds = canvasData.nodes
      .map((n) => n.nodeDataId)
      .filter((id): id is Id<"nodeDatas"> => id !== null);

    if (nodeDataIds.length > 0) {
      await ctx.runAction(internal.ia.helpers.abstractGenerator.generateMany, {
        nodeDataIds,
      });
    }

    // 3. Re-fetch avec les abstracts frais
    const freshData = await ctx.runQuery(
      internal.ia.nole.brain.getCanvasNodeDatasWithAbstracts
        .getCanvasNodeDatasWithAbstracts,
      { canvasId },
    );
    if (!freshData) return "No canvas found.";

    // 4. Construire le résumé
    return buildCanvasSummary(freshData);
  },
});

// ── Helpers ─────────────────────────────────────────────────────────────

function buildCanvasSummary(data: CanvasData): string {
  // Build a map: source nodeId → list of target nodeIds
  const targetsBySource = new Map<string, string[]>();
  for (const edge of data.edges) {
    const targets = targetsBySource.get(edge.source);
    if (targets) {
      targets.push(edge.target);
    } else {
      targetsBySource.set(edge.source, [edge.target]);
    }
  }

  const nodesSummary = encode(
    data.nodes.map((node) => ({
      idOnCanvas: node.idOnCanvas,
      type: node.type,
      position: JSON.stringify(node.position),
      nodeDataId: node.nodeDataId,
      abstract: node.abstract ?? "No abstract available",
      targetNodes: targetsBySource.get(node.idOnCanvas) ?? [],
    })),
  );

  return `## Current canvas context

Here is the canvas that the user is currently working on:

- Canvas ID: ${data.canvasId}
- Canvas title: ${data.name}
- Number of nodes: ${data.nodeCount}

### Nodes summary
${nodesSummary}

### To know more
If you want to know more about the canvas or its nodes, you can use the provided tools: 
- readNodeDataTool using the nodeDataId

Give the tools the necessary information to retrieve the relevant data (nodeId, canvasId...). Those tools can also be used to update the canvas or its nodes, again, in a natural language way.`;
}
