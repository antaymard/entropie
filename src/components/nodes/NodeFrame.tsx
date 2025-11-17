import { NodeResizer, type Node } from "@xyflow/react";
import { memo } from "react";
import type { NodeColors } from "../../types/node.types";
import { useNode } from "../../stores/canvasStore";
import prebuiltNodesList from "./prebuilt-nodes/prebuiltNodesList";
import { BaseNode, BaseNodeContent } from "./base-node";

import { getNodeColorClasses } from "../nodes/nodeConfigs";

function NodeFrame({
  xyNode,
  borderless = false,
  showNodeName = false,
  children,
}: {
  xyNode: Node;
  borderless?: boolean;
  showNodeName?: boolean;
  children: React.ReactNode;
}) {
  const canvasNode = useNode(xyNode.id);
  const nodeConfig = prebuiltNodesList.find((n) => n.type === xyNode.type);

  if (!canvasNode) return null;

  const nodeColor = getNodeColorClasses(canvasNode?.color as NodeColors);

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
        {showNodeName && (
          <div className={`${getClassNames().nodeName} rounded-t-md`}>
            {canvasNode.name}
          </div>
        )}
        <BaseNodeContent className={`${getClassNames().baseNodeContent}`}>
          {children}
        </BaseNodeContent>
      </BaseNode>
    </>
  );
}

export default memo(NodeFrame);
