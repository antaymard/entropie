import { NodeResizer, type Node } from "@xyflow/react";
import { memo } from "react";
import type { CanvasNode, NodeColors } from "../../types/node.types";
import { useNode } from "../../stores/canvasStore";
import prebuiltNodesList from "./prebuilt-nodes/prebuiltNodesList";
import { BaseNode, BaseNodeContent } from "./base-node";
import { colors } from "./nodeConfigs";

function getNodeColorClasses(color: NodeColors) {
  return colors[color] || colors["default"];
}

function NodeFrame({
  xyNode,
  frameless = false,
  children,
}: {
  xyNode: Node;
  frameless?: boolean;
  children: React.ReactNode;
}) {
  const canvasNode = useNode(xyNode.id);
  const nodeConfig = prebuiltNodesList.find((n) => n.type === xyNode.type);

  if (!canvasNode) return null;

  function getClassNames() {
    let baseNode = "",
      baseNodeContent = "";

    if (frameless) {
      baseNodeContent = "p-1 px-2 ";
      baseNode = "border-0 ";
    }

    const nodeColor = getNodeColorClasses(canvasNode?.color as NodeColors);

    baseNode += `${nodeColor.border} ${nodeColor.bg} ${nodeColor.text}`;

    return {
      baseNode,
      baseNodeContent,
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
        className={`h-full ${xyNode.selected ? "hover:ring-0" : "hover:ring-blue-300"} ${getClassNames().baseNode}`}
      >
        <BaseNodeContent className={getClassNames().baseNodeContent}>
          {children}
        </BaseNodeContent>
      </BaseNode>
    </>
  );
}

export default memo(NodeFrame);
