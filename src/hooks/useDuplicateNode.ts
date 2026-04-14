import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCreateNode } from "@/hooks/useCreateNode";
import { useNodeDataStore } from "@/stores/nodeDataStore";

export function useDuplicateNode() {
  const { createNode } = useCreateNode();
  const getNodeData = useNodeDataStore((state) => state.getNodeData);

  const duplicateNode = useCallback(
    async (nodeToDuplicate: Node) => {
      let initialValues: Record<string, unknown> | undefined;
      const nodeDataId = nodeToDuplicate.data?.nodeDataId as
        | Id<"nodeDatas">
        | undefined;

      if (nodeDataId) {
        const nodeData = getNodeData(nodeDataId);
        if (nodeData) {
          initialValues = nodeData.values;
        }
      }

      return createNode({
        node: nodeToDuplicate,
        position: {
          x: nodeToDuplicate.position.x + 50,
          y: nodeToDuplicate.position.y + 50,
        },
        initialValues,
      });
    },
    [createNode, getNodeData],
  );

  return { duplicateNode };
}
