import { NodeResizer, type Node } from "@xyflow/react";
import { memo } from "react";
import type { CanvasNode, NodeColors } from "../../types/node.types";
import { useNode, useCanvasStore } from "../../stores/canvasStore";
import prebuiltNodesList from "./prebuilt-nodes/prebuiltNodesList";
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from "./base-node";
import { colors } from "./nodeConfigs";
import InlineEditableText from "../common/InlineEditableText";

import { getNodeColorClasses } from "../nodes/nodeConfigs";

function NodeFrame({
  xyNode,
  frameless = false,
  showName = false,
  children,
}: {
  xyNode: Node;
  frameless?: boolean;
  showName?: boolean;
  children: React.ReactNode;
}) {
  const canvasNode = useNode(xyNode.id);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const nodeConfig = prebuiltNodesList.find((n) => n.type === xyNode.type);

  if (!canvasNode) return null;

  const handleNameSave = (newName: string) => {
    updateNodeData(xyNode.id, { name: newName });
  };

  function getClassNames() {
    let baseNode = "",
      baseNodeContent = "",
      nodeName = "";

    if (borderless) {
      baseNodeContent = "p-1 px-2 ";
      baseNode = "border-0 ";
    }

    baseNode += `${nodeColor.border} ${nodeColor.nodeBg} `;
    nodeName += `${nodeColor.nameBg} text-sm font-medium p-1 px-2 border-b ${nodeColor.text} ${nodeColor.border} `;

    return {
      baseNode,
      baseNodeContent,
      nodeName,
    };
  }
  return (
    <>
      <NodeResizer
        minWidth={nodeConfig?.minWidth || 150}
        minHeight={nodeConfig?.minHeight || 100}
        isVisible={xyNode?.selected}
      />

      <BaseNode
        className={`h-full ${xyNode.selected ? "hover:ring-0" : "hover:ring-blue-300"} ${getClassNames().baseNode} `}
      >
        {showName && (
          <BaseNodeHeader>
            <BaseNodeHeaderTitle>
              <InlineEditableText
                value={(canvasNode?.data?.name as string) || "Sans nom"}
                onSave={handleNameSave}
                textClassName="text-sm font-semibold"
                placeholder="Sans nom"
              />
            </BaseNodeHeaderTitle>
          </BaseNodeHeader>
        )}
        <BaseNodeContent className={getClassNames().baseNodeContent}>
          {children}
        </BaseNodeContent>
      </BaseNode>
    </>
  );
}

export default memo(NodeFrame);
