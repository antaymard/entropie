import { NodeResizer, useReactFlow, type Node } from "@xyflow/react";
import { memo } from "react";
import type { CanvasNode, NodeColors } from "../../types/node.types";
import { useCanvasStore } from "../../stores/canvasStore";
import prebuiltNodesList from "./prebuilt-nodes/prebuiltNodesList";
import { BaseNode, BaseNodeContent, BaseNodeHeader, BaseNodeHeaderTitle } from "./base-node";
import { colors } from "./nodeConfigs";
import InlineEditableText from "../common/InlineEditableText";

function getNodeColorClasses(color: NodeColors) {
  return colors[color] || colors["default"];
}

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
  const { updateNodeData } = useReactFlow();
  const nodeConfig = prebuiltNodesList.find((n) => n.type === xyNode.type);

  if (!xyNode) return null;

  const handleNameSave = (newName: string) => {
    updateNodeData(xyNode.id, { name: newName });
  };

  function getClassNames() {
    let baseNode = "",
      baseNodeContent = "";

    if (frameless) {
      baseNodeContent = "p-1 px-2 ";
      baseNode = "border-0 ";
    }

    const nodeColor = getNodeColorClasses(xyNode.data?.color as NodeColors);

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
        {showName && (
          <BaseNodeHeader>
            <BaseNodeHeaderTitle>
              <InlineEditableText
                value={(xyNode?.data?.name as string) || "Sans nom"}
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
