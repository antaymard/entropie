import { useMemo } from "react";
import { useEdges, useNodes, useNodeId, type Node } from "@xyflow/react";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import type { NodeData } from "@/types/node.types";
import type { Id } from "@/../convex/_generated/dataModel";

export type ConnectionType = "source" | "target" | "all";

export interface ConnectedNodeInfo {
  node: Node;
  nodeData: NodeData | null;
  type: "source" | "target";
}

export function useConnectedNodes(
  connectionType: ConnectionType = "all"
): ConnectedNodeInfo[] {
  const nodeId = useNodeId();
  const edges = useEdges();
  const nodes = useNodes();
  const getNodeData = useNodeDataStore((state) => state.getNodeData);

  return useMemo(() => {
    if (!nodeId) return [];

    const result: ConnectedNodeInfo[] = [];

    // Créer une map pour lookup O(1) des nodes par id
    const nodesMap = new Map<string, Node>();
    for (const node of nodes) {
      nodesMap.set(node.id, node);
    }

    // Trouver les nodes sources (qui alimentent le node actuel)
    if (connectionType === "source" || connectionType === "all") {
      const sourceEdges = edges.filter((edge) => edge.target === nodeId);
      for (const edge of sourceEdges) {
        const sourceNode = nodesMap.get(edge.source);
        if (sourceNode) {
          const nodeDataId = sourceNode.data?.nodeDataId as
            | Id<"nodeDatas">
            | undefined;
          result.push({
            node: sourceNode,
            nodeData: nodeDataId ? getNodeData(nodeDataId) ?? null : null,
            type: "source",
          });
        }
      }
    }

    // Trouver les nodes targets (que le node actuel alimente)
    if (connectionType === "target" || connectionType === "all") {
      const targetEdges = edges.filter((edge) => edge.source === nodeId);
      for (const edge of targetEdges) {
        const targetNode = nodesMap.get(edge.target);
        if (targetNode) {
          const nodeDataId = targetNode.data?.nodeDataId as
            | Id<"nodeDatas">
            | undefined;
          result.push({
            node: targetNode,
            nodeData: nodeDataId ? getNodeData(nodeDataId) ?? null : null,
            type: "target",
          });
        }
      }
    }

    return result;
  }, [nodeId, edges, nodes, connectionType, getNodeData]);
}
