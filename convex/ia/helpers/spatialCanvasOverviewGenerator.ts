import { v } from "convex/values";
import { encode } from "@toon-format/toon";
import type { Id } from "../../_generated/dataModel";
import { internalQuery } from "../../_generated/server";
import type { QueryCtx } from "../../_generated/server";
import { getNodeDataTitle } from "../../lib/getNodeDataTitle";

type SpatialNodeOverview = {
  nodeId: string;
  nodeType: string;
  title: string | null;
};

type SpatialCluster = {
  clusterId: string;
  centroid: { x: number; y: number };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  nodes: SpatialNodeOverview[];
};

type ClusterableCanvasNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  nodeDataId?: Id<"nodeDatas">;
};

type CanvasEdge = {
  source: string;
  target: string;
};

export const generate = internalQuery({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    const canvas = await ctx.db.get("canvases", canvasId);
    if (!canvas) {
      return {
        canvasId,
        clusters: [] as SpatialCluster[],
        count: {
          nodeCount: 0,
          edgeCount: 0,
          clusterCount: 0,
          clusterSizes: [] as number[],
        },
        hybridToon:
          '<canvas_overview name="unknown" description=""></canvas_overview>',
      };
    }

    const canvasNodes = (canvas.nodes ?? []) as ClusterableCanvasNode[];
    const canvasEdges = (canvas.edges ?? []) as CanvasEdge[];

    const titleByNodeId = await buildEligibleTitlesByNodeId(ctx, canvasNodes);
    const clusters = clusterNodesByPriority(canvasNodes, canvasEdges).map(
      (cluster, index) => {
        const enrichedNodes: SpatialNodeOverview[] = cluster.nodes.map(
          (node) => ({
            nodeId: node.id,
            nodeType: node.type,
            title: titleByNodeId.get(node.id) ?? null,
          }),
        );

        return {
          clusterId: `cluster-${index + 1}`,
          centroid: cluster.centroid,
          bounds: cluster.bounds,
          nodes: enrichedNodes,
        };
      },
    );

    const count = {
      nodeCount: canvasNodes.length,
      edgeCount: canvasEdges.length,
      clusterCount: clusters.length,
      clusterSizes: clusters.map((cluster) => cluster.nodes.length),
    };

    return {
      canvasId: canvas._id,
      clusters,
      count,
      hybridToon: formatHybridToonForLLM(
        canvas.name ?? "Untitled",
        canvas.description ?? "",
        clusters,
      ),
    };
  },
});

async function buildEligibleTitlesByNodeId(
  ctx: QueryCtx,
  nodes: ClusterableCanvasNode[],
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    nodes.map(async (node) => {
      if (!node.nodeDataId) return null;

      const nodeData = await ctx.db.get("nodeDatas", node.nodeDataId);
      if (!nodeData) return null;

      const title = getNodeDataTitle(nodeData);
      if (!title) return null;

      return [node.id, title] as const;
    }),
  );

  return new Map(
    entries.filter((entry): entry is readonly [string, string] => !!entry),
  );
}

function clusterNodesByPriority(
  nodes: ClusterableCanvasNode[],
  edges: CanvasEdge[],
): Array<{
  nodes: ClusterableCanvasNode[];
  centroid: { x: number; y: number };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}> {
  if (nodes.length === 0) {
    return [];
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node] as const));
  const connectedGroups = getConnectedNodeGroups(nodes, edges, nodeById);

  const connectedClusters: ClusterableCanvasNode[][] = [];
  const isolatedNodes: ClusterableCanvasNode[] = [];

  for (const group of connectedGroups) {
    if (group.length > 1) {
      connectedClusters.push(group);
    } else {
      isolatedNodes.push(group[0]);
    }
  }

  const isolatedClusters = clusterOrphanNodesByProximity(isolatedNodes);
  const allClusters = [...connectedClusters, ...isolatedClusters];

  const clusters = allClusters.map((clusterNodes) => {
    clusterNodes.sort((a, b) => {
      if (a.position.y !== b.position.y) return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });

    return {
      nodes: clusterNodes,
      centroid: getClusterCentroid(clusterNodes),
      bounds: getClusterBounds(clusterNodes),
    };
  });

  clusters.sort((a, b) => {
    if (a.centroid.y !== b.centroid.y) return a.centroid.y - b.centroid.y;
    return a.centroid.x - b.centroid.x;
  });

  return clusters;
}

function getConnectedNodeGroups(
  nodes: ClusterableCanvasNode[],
  edges: CanvasEdge[],
  nodeById: Map<string, ClusterableCanvasNode>,
): ClusterableCanvasNode[][] {
  const adjacency = new Map<string, Set<string>>();

  for (const node of nodes) {
    adjacency.set(node.id, new Set<string>());
  }

  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;

    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>();
  const groups: ClusterableCanvasNode[][] = [];

  for (const node of nodes) {
    if (visited.has(node.id)) continue;

    const stack = [node.id];
    visited.add(node.id);
    const group: ClusterableCanvasNode[] = [];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId) continue;

      const currentNode = nodeById.get(currentId);
      if (currentNode) group.push(currentNode);

      const neighbors = adjacency.get(currentId);
      if (!neighbors) continue;

      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);
        stack.push(neighborId);
      }
    }

    if (group.length > 0) {
      groups.push(group);
    }
  }

  return groups;
}

function clusterOrphanNodesByProximity(
  nodes: ClusterableCanvasNode[],
): ClusterableCanvasNode[][] {
  if (nodes.length === 0) return [];

  const nodeById = new Map(nodes.map((node) => [node.id, node] as const));
  const adjacency = new Map<string, Set<string>>();

  for (const node of nodes) {
    adjacency.set(node.id, new Set<string>());
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (!areNodesClose(nodes[i], nodes[j])) continue;

      adjacency.get(nodes[i].id)?.add(nodes[j].id);
      adjacency.get(nodes[j].id)?.add(nodes[i].id);
    }
  }

  const visited = new Set<string>();
  const clusters: ClusterableCanvasNode[][] = [];

  for (const node of nodes) {
    if (visited.has(node.id)) continue;

    const stack = [node.id];
    visited.add(node.id);
    const cluster: ClusterableCanvasNode[] = [];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId) continue;

      const currentNode = nodeById.get(currentId);
      if (currentNode) cluster.push(currentNode);

      const neighbors = adjacency.get(currentId);
      if (!neighbors) continue;

      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);
        stack.push(neighborId);
      }
    }

    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }

  return clusters;
}

function getClusterCentroid(nodes: ClusterableCanvasNode[]): {
  x: number;
  y: number;
} {
  const sums = nodes.reduce(
    (acc, node) => ({
      x: acc.x + getNodeCenter(node).x,
      y: acc.y + getNodeCenter(node).y,
    }),
    { x: 0, y: 0 },
  );

  const size = Math.max(nodes.length, 1);

  return {
    x: roundTo2(sums.x / size),
    y: roundTo2(sums.y / size),
  };
}

function getClusterBounds(nodes: ClusterableCanvasNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const left = node.position.x;
    const top = node.position.y;
    const right = node.position.x + (node.width ?? 0);
    const bottom = node.position.y + (node.height ?? 0);

    if (left < minX) minX = left;
    if (top < minY) minY = top;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  return {
    minX: roundTo2(minX),
    minY: roundTo2(minY),
    maxX: roundTo2(maxX),
    maxY: roundTo2(maxY),
  };
}

function getNodeCenter(node: ClusterableCanvasNode): { x: number; y: number } {
  return {
    x: node.position.x + (node.width ?? 0) / 2,
    y: node.position.y + (node.height ?? 0) / 2,
  };
}

function areNodesClose(
  leftNode: ClusterableCanvasNode,
  rightNode: ClusterableCanvasNode,
): boolean {
  const leftBounds = getNodeBounds(leftNode);
  const rightBounds = getNodeBounds(rightNode);

  const horizontalGap = getAxisGap(
    leftBounds.minX,
    leftBounds.maxX,
    rightBounds.minX,
    rightBounds.maxX,
  );
  const verticalGap = getAxisGap(
    leftBounds.minY,
    leftBounds.maxY,
    rightBounds.minY,
    rightBounds.maxY,
  );

  const horizontalThreshold = Math.max(
    (leftBounds.width * 0.1 + rightBounds.width * 0.1) / 2,
    1,
  );
  const verticalThreshold = Math.max(
    (leftBounds.height * 0.1 + rightBounds.height * 0.1) / 2,
    1,
  );

  return (
    horizontalGap <= horizontalThreshold && verticalGap <= verticalThreshold
  );
}

function getNodeBounds(node: ClusterableCanvasNode): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  const width = node.width ?? 0;
  const height = node.height ?? 0;

  return {
    minX: node.position.x,
    maxX: node.position.x + width,
    minY: node.position.y,
    maxY: node.position.y + height,
    width,
    height,
  };
}

function getAxisGap(
  firstMin: number,
  firstMax: number,
  secondMin: number,
  secondMax: number,
): number {
  if (firstMax < secondMin) {
    return secondMin - firstMax;
  }

  if (secondMax < firstMin) {
    return firstMin - secondMax;
  }

  return 0;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatHybridToonForLLM(
  canvasName: string,
  canvasDescription: string,
  clusters: SpatialCluster[],
): string {
  const clusterXml = clusters
    .map((cluster) => {
      const encodedNodes = encode(
        cluster.nodes.map((node) => ({
          nodeId: node.nodeId,
          nodeType: node.nodeType,
          title: node.title,
        })),
      );

      return `<cluster size="${cluster.nodes.length}">\n${encodedNodes}\n</cluster>`;
    })
    .join("\n");

  return `
<canvas_overview name="${escapeXml(canvasName)}" description="${escapeXml(canvasDescription)}">\n${clusterXml}\n</canvas_overview>
  `.trim();
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
