import { NodeResizer, useReactFlow, type Node } from "@xyflow/react";
import {
  createContext,
  memo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
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

type NodeSidePanel = {
  id: string;
  element: React.ReactNode;
};
type NodeContextType = {
  openSidePanels: NodeSidePanel[] | [];
  setOpenSidePanels: Dispatch<SetStateAction<NodeSidePanel[]>>;
  closeSidePanel: (id: string) => void;
  openSidePanel: (id: string, element: React.ReactNode) => void;
};
// Create a node Context
const NodeContext = createContext<NodeContextType>({
  openSidePanels: [{ id: "", element: null }],
  setOpenSidePanels: () => {
    return {};
  },
  closeSidePanel: (id: string) => {},
  openSidePanel: (id: string, element: React.ReactNode) => {},
});

function NodeFrame({
  xyNode,
  headerless = false,
  children,
  nodeContentClassName = "",
}: {
  xyNode: Node;
  headerless?: boolean;
  children: React.ReactNode;
  nodeContentClassName?: string;
}) {
  const { updateNodeData } = useReactFlow();
  const nodeConfig = prebuiltNodesConfig.find((n) => n.type === xyNode.type);
  const openWindow = useWindowsStore((state) => state.openWindow);

  const [openSidePanels, setOpenSidePanels] = useState<NodeSidePanel[]>([]);

  if (!xyNode) return null;

  const handleNameSave = (newName: string) => {
    updateNodeData(xyNode.id, { name: newName });
  };
  const nodeColor = getNodeColorClasses(xyNode.data?.color as NodeColors);
  const Icon = nodeConfig?.nodeIcon;

  return (
    <>
      <NodeResizer
        minWidth={nodeConfig?.node.minWidth || 150}
        minHeight={nodeConfig?.node.minHeight || 100}
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
      <NodeContext.Provider
        value={{
          openSidePanels,
          setOpenSidePanels,
          closeSidePanel: (id) => {
            setOpenSidePanels((panels) =>
              panels.filter((panel) => panel.id !== id)
            );
          },
          openSidePanel: (id, element) => {
            setOpenSidePanels((panels) => {
              if (panels.find((panel) => panel.id === id)) {
                return panels;
              }
              return [...panels, { id, element }];
            });
          },
        }}
      >
        <BaseNode
          className={`group rounded-sm h-full flex flex-col overflow-hidden ${xyNode.selected ? "hover:ring-0" : "hover:ring-blue-300"} ${nodeColor.border} ${nodeColor.bg}`}
        >
          {!headerless && (
            <div
              className={`${nodeColor.bg} ${nodeColor.text} px-1 py-[3px] rounded-t-sm flex gap-8 items-center justify-between`}
              // onDoubleClick={(e) => e.stopPropagation()} // Block global node doubleclick trigger
            >
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {Icon && <Icon size={15} className="mb-0.5" />}
                <InlineEditableText
                  value={(xyNode?.data?.name as string) || "Sans nom"}
                  onSave={handleNameSave}
                  className=" font-semibold text-sm truncate w-full"
                  placeholder="Sans nom"
                />
              </div>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 hover:bg-black/10 rounded-xs "
                onClick={() =>
                  openWindow({
                    id: xyNode.id,
                    type: xyNode.type as NodeType,
                    position: { x: 100, y: 100 },
                    width: nodeConfig?.window?.initialWidth || 300,
                    height: nodeConfig?.window?.initialHeight || 300,
                    isMinimized: false,
                  })
                }
              >
                <AiOutlineFullscreen size={15} />
              </button>
            </div>
          )}
          <BaseNodeContent
            className={
              "flex-1 overflow-hidden " +
              (headerless
                ? " p-1 px-2 " + nodeColor.bg + " " + nodeColor.text
                : " bg-white mx-0.5 mb-0.5 rounded-xs") +
              " " +
              nodeContentClassName
            }
          >
            {children}
          </BaseNodeContent>
        </BaseNode>
        <div
          className="absolute top-0 w-full h-full pointer-events-none"
          style={{
            left: Number(xyNode.width) + 10,
          }}
        >
          {openSidePanels.map((panel) => (
            <div key={panel.id}>{panel.element}</div>
          ))}
        </div>
      </NodeContext.Provider>
    </>
  );
}

export default memo(NodeFrame);
