import { NodeResizer, useReactFlow, type Node } from "@xyflow/react";
import { memo } from "react";
import type { NodeColors, NodeType } from "../../types/node.types";
import prebuiltNodesConfig from "./prebuilt-nodes/prebuiltNodesConfig";
import { BaseNode, BaseNodeContent } from "./base-node";
import nodeColors from "./nodeColors";
import InlineEditableText from "../form-ui/InlineEditableText";
import { AiOutlineFullscreen } from "react-icons/ai";
import { useWindowsStore } from "@/stores/windowsStore";

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
  const openWindow = useWindowsStore((state) => state.openWindow);

  if (!xyNode) return null;

  const handleNameSave = (newName: string) => {
    updateNodeData(xyNode.id, { name: newName });
  };

  function getClassNames() {
    let baseNode = "",
      baseNodeContent = "",
      nameContainer = "";

    const nodeColor = getNodeColorClasses(xyNode.data?.color as NodeColors);

    if (frameless) {
      baseNodeContent = "p-1 px-2 ";
      baseNode = nodeColor.bg;
    }

    baseNode += ` ${nodeColor.border} ${nodeColor.text}`;
    nameContainer += ` ${nodeColor.darkBg} ${nodeColor.text} ${nodeColor.border}`;

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
        className={`group h-full flex flex-col overflow-hidden ${xyNode.selected ? "hover:ring-0" : "hover:ring-blue-300"} ${getClassNames().baseNode}`}
      >
        {showName && (
          <div
            className={`${getClassNames().nameContainer} px-1 py-0.5 border-b rounded-t-md flex items-center justify-between`}
            onDoubleClick={(e) => e.stopPropagation()} // Block global node doubleclick trigger
          >
            <InlineEditableText
              value={(xyNode?.data?.name as string) || "Sans nom"}
              onSave={handleNameSave}
              className=" font-semibold text-sm"
              placeholder="Sans nom"
            />
            <button
              type="button"
              className="opacity-0 group-hover:opacity-50 hover:opacity-100"
              onClick={() =>
                openWindow({
                  id: xyNode.id,
                  type: xyNode.type as NodeType,
                  position: { x: 100, y: 100 },
                  width: 400,
                  height: 300,
                  isMinimized: false,
                })
              }
            >
              <AiOutlineFullscreen size={12} />
            </button>
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
