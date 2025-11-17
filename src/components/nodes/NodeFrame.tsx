import { NodeResizer, useReactFlow, type Node } from "@xyflow/react";
import { memo } from "react";
import type { NodeColors } from "../../types/node.types";
import prebuiltNodesConfig from "./prebuilt-nodes/prebuiltNodesConfig";
import { BaseNode, BaseNodeContent } from "./base-node";
import nodeColors from "./nodeColors";
import InlineEditableText from "../common/InlineEditableText";

function getNodeColorClasses(color: NodeColors) {
  return nodeColors[color] || nodeColors["default"];
}

function NodeFrame({
  xyNode,
  frameless = false,
  showName = true,
  children,
  nodeContentClassName = "",
}: {
  xyNode: Node;
  frameless?: boolean;
  showName?: boolean;
  children: React.ReactNode;
  nodeContentClassName?: string;
}) {
  const { updateNodeData } = useReactFlow();
  const nodeConfig = prebuiltNodesConfig.find((n) => n.type === xyNode.type);

  if (!xyNode) return null;

  const handleNameSave = (newName: string) => {
    updateNodeData(xyNode.id, { name: newName });
  };

  function getClassNames() {
    let baseNode = "",
      baseNodeContent = "",
      nameContainer = "";

    if (frameless) {
      baseNodeContent = "p-1 px-2 ";
      // baseNode = "border-0 ";
    }

    const nodeColor = getNodeColorClasses(xyNode.data?.color as NodeColors);

    baseNode += `${nodeColor.border} ${nodeColor.bg} ${nodeColor.text}`;
    nameContainer += `${nodeColor.darkBg} ${nodeColor.text} ${nodeColor.border}`;

    return {
      baseNode,
      baseNodeContent,
      nameContainer,
    };
  }
  return (
    <>
      <NodeResizer
        minWidth={nodeConfig?.minWidth || 150}
        minHeight={nodeConfig?.minHeight || 100}
        isVisible={xyNode?.selected}
        lineStyle={{
          // padding: 1,
          borderWidth: 2,
        }}
        handleStyle={{
          height: 8,
          width: 8,
          borderRadius: 2,
          zIndex: 10,
        }}
      />

      <BaseNode
        className={`h-full flex flex-col overflow-hidden ${xyNode.selected ? "hover:ring-0" : "hover:ring-blue-300"} ${getClassNames().baseNode}`}
      >
        {showName && (
          <div
            className={`${getClassNames().nameContainer} px-2 border-b rounded-t-md`}
          >
            <InlineEditableText
              value={(xyNode?.data?.name as string) || "Sans nom"}
              onSave={handleNameSave}
              className=" font-semibold text-sm"
              placeholder="Sans nom"
            />
          </div>
        )}
        <BaseNodeContent
          className={
            getClassNames().baseNodeContent +
            " flex-1 overflow-hidden " +
            nodeContentClassName
          }
        >
          {children}
        </BaseNodeContent>
      </BaseNode>
    </>
  );
}

export default memo(NodeFrame);
