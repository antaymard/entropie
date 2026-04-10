import { useCallback } from "react";
import { useStore } from "@xyflow/react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import type { Id } from "@/../convex/_generated/dataModel";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { useWindowsStore } from "@/stores/windowsStore";
import type { NodeType } from "@/types/domain/nodeTypes";
import { openableNodeTypes } from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";

function isOpenableNodeType(type: string): type is NodeType {
  return openableNodeTypes.has(type as NodeType);
}

export function useOpenMentionedNodeWindow(
  nodeDataId: Id<"nodeDatas"> | undefined,
) {
  const { t } = useTranslation();
  const nodeDatas = useNodeDataStore((state) => state.nodeDatas);
  const nodes = useStore((state) => state.nodes);
  const openWindow = useWindowsStore((state) => state.openWindow);

  return useCallback(() => {
    if (!nodeDataId) return;

    const nodeData = nodeDatas.get(nodeDataId);

    if (!nodeData) {
      toast(t("mentionedNode.nodeNotFound"));
      return;
    }

    if (!isOpenableNodeType(nodeData.type)) {
      toast(t("mentionedNode.cannotOpenInWindow"));
      return;
    }

    const xyNode = nodes.find((node) => node.data?.nodeDataId === nodeDataId);

    if (!xyNode) {
      toast(t("mentionedNode.nodeNotVisible"));
      return;
    }

    openWindow({
      xyNodeId: xyNode.id,
      nodeDataId,
      nodeType: nodeData.type,
    });
  }, [nodeDataId, nodeDatas, nodes, openWindow, t]);
}
