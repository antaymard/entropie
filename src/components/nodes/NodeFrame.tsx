import { NodeResizer, type Node } from "@xyflow/react";
import { memo } from "react";
import type { CanvasNode, NodeColors } from "../../types/node.types";
import { useNode } from "../../stores/canvasStore";
import prebuiltNodesList from "./prebuilt-nodes/prebuiltNodesList";
import { BaseNode, BaseNodeContent } from "./base-node";

const nodeColorClassNames = {
  blue: {
    border: "border-blue-500",
    background: "bg-blue-100",
  },
  green: {
    border: "border-green-500",
    background: "bg-green-100",
  },
  red: {
    border: "border-red-500",
    background: "bg-red-100",
  },
  yellow: {
    border: "border-yellow-500",
    background: "bg-yellow-100",
  },
  purple: {
    border: "border-purple-500",
    background: "bg-purple-100",
  },
  default: {
    border: "border-gray-500",
    background: "bg-gray-100",
  },
};

function getNodeColorClasses(color: NodeColors) {
  return nodeColorClassNames[color] || nodeColorClassNames["default"];
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

  return (
    <>
      <NodeResizer
        minWidth={nodeConfig?.minWidth || 150}
        minHeight={nodeConfig?.minHeight || 100}
        isVisible={xyNode?.selected}
      />

      <BaseNode
        className={`h-full ${xyNode.selected ? "hover:ring-0" : "hover:ring-blue-300"} ${frameless ? "border-none bg-transparent" : ""}`}
      >
        <BaseNodeContent className={`${frameless ? "p-0" : ""}`}>
          {children}
        </BaseNodeContent>
      </BaseNode>
    </>
  );
}

export default memo(NodeFrame);
