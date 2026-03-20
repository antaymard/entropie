import { useCallback } from "react";
import { useStore } from "@xyflow/react";
import toast from "react-hot-toast";

import type { Id } from "@/../convex/_generated/dataModel";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { useWindowsStore } from "@/stores/windowsStore";
import type { nodeTypes } from "@/types/domain/nodeTypes";

const OPENABLE_WINDOW_TYPES: Set<nodeTypes> = new Set([
  "document",
  "embed",
  "file",
  "image",
]);

function isOpenableNodeType(type: string): type is nodeTypes {
  return OPENABLE_WINDOW_TYPES.has(type as nodeTypes);
}

export function useOpenMentionedNodeWindow(
  nodeDataId: Id<"nodeDatas"> | undefined,
) {
  const nodeDatas = useNodeDataStore((state) => state.nodeDatas);
  const nodes = useStore((state) => state.nodes);
  const openWindow = useWindowsStore((state) => state.openWindow);

  return useCallback(() => {
    if (!nodeDataId) return;

    const nodeData = nodeDatas.get(nodeDataId);

    if (!nodeData) {
      toast("Node introuvable dans ce canvas.");
      return;
    }

    if (!isOpenableNodeType(nodeData.type)) {
      toast("Ce type de node ne peut pas etre ouvert en fenetre.");
      return;
    }

    const xyNode = nodes.find((node) => node.data?.nodeDataId === nodeDataId);

    if (!xyNode) {
      toast("Ce node n'est pas visible sur ce canvas.");
      return;
    }

    openWindow({
      xyNodeId: xyNode.id,
      nodeDataId,
      nodeType: nodeData.type,
    });
  }, [nodeDataId, nodeDatas, nodes, openWindow]);
}
