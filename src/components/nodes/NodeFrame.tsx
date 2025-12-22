import {
  NodeResizer,
  NodeToolbar,
  useReactFlow,
  Position,
  type Node,
  Handle,
} from "@xyflow/react";
import { memo, useState, useMemo, useCallback, type MouseEvent } from "react";
import type { NodeColors, NodeType } from "../../types/node.types";
import prebuiltNodesConfig from "./prebuilt-nodes/prebuiltNodesConfig";
import { BaseNode, BaseNodeContent } from "./base-node";
import nodeColors from "./nodeColors";
import InlineEditableText from "../form-ui/InlineEditableText";
import { AiOutlineFullscreen } from "react-icons/ai";
import { useWindowsStore } from "@/stores/windowsStore";
import {
  NodeContext,
  type NodeSidePanel,
} from "./side-panels/NodeSidePanelContext";
import { useCanvasStore } from "@/stores/canvasStore";
import { cn } from "@/lib/utils";
import { useIsNodeAttached, useNoleStore } from "@/stores/noleStore";

function getNodeColorClasses(color: NodeColors) {
  return nodeColors[color] || nodeColors["default"];
}

function NodeFrame({
  xyNode,
  headerless = false,
  notResizable = false,
  disableHandles = false,
  children,
  nodeContentClassName = "",
}: {
  xyNode: Node;
  headerless?: boolean;
  notResizable?: boolean;
  disableHandles?: boolean;
  children: React.ReactNode;
  nodeContentClassName?: string;
}) {
  const { updateNodeData } = useReactFlow();
  const nodeConfig = prebuiltNodesConfig.find((n) => n.type === xyNode.type);
  const openWindow = useWindowsStore((state) => state.openWindow);
  const currentCanvasTool = useCanvasStore((state) => state.currentCanvasTool);
  const addAttachments = useNoleStore((state) => state.addAttachments);
  const isNoleAttached = useIsNodeAttached(xyNode.id);

  const [openSidePanels, setOpenSidePanels] = useState<NodeSidePanel[]>([]);

  const closeSidePanel = useCallback((id: string) => {
    setOpenSidePanels((panels) => panels.filter((panel) => panel.id !== id));
  }, []);

  const openSidePanel = useCallback((id: string, element: React.ReactNode) => {
    setOpenSidePanels((panels) => {
      if (panels.find((panel) => panel.id === id)) {
        return panels;
      }
      return [...panels, { id, element }];
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      openSidePanels,
      setOpenSidePanels,
      closeSidePanel,
      openSidePanel,
    }),
    [openSidePanels, closeSidePanel, openSidePanel]
  );

  if (!xyNode) return null;

  const handleNameSave = (newName: string) => {
    updateNodeData(xyNode.id, { name: newName });
  };
  const nodeColor = getNodeColorClasses(xyNode.data?.color as NodeColors);
  const Icon = nodeConfig?.nodeIcon;

  const canDrag = currentCanvasTool === "default";

  return (
    <>
      <NodeContext.Provider value={contextValue}>
        {!notResizable && (
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
        )}
        <NodeToolbar position={Position.Right} align="start">
          {openSidePanels.map((panel) => (
            <div key={panel.id} className="">
              {panel.element}
            </div>
          ))}
        </NodeToolbar>
        <BaseNode
          onMouseDown={() => {
            if (currentCanvasTool !== "edge") return;
            console.log("In", xyNode.id);
          }}
          onMouseUp={() => {
            if (currentCanvasTool !== "edge") return;
            console.log("Out", xyNode.id);
          }}
          className={cn(
            "group rounded-sm h-full flex flex-col transition-shadow duration-150",
            nodeColor.border,
            nodeColor.bg,
            !canDrag && "nodrag cursor-crosshair",
            // États visuels par priorité
            isNoleAttached
              ? "ring-2 ring-violet-400 shadow-md shadow-violet-300/40"
              : xyNode.selected
                ? notResizable
                  ? "ring-2 ring-muted-foreground"
                  : "ring-2 ring-blue-500/70"
                : "hover:ring-1 hover:ring-blue-400/60"
          )}
          onClick={(e: MouseEvent) => {
            if (e.altKey) {
              addAttachments({ nodes: [xyNode] }, true);
            }
          }}
        >
          {!disableHandles && (
            <>
              <Handle position={Position.Right} id={xyNode.id + "right"} />
              <Handle position={Position.Left} id={xyNode.id + "left"} />
              <Handle position={Position.Top} id={xyNode.id + "top"} />
              <Handle position={Position.Bottom} id={xyNode.id + "bottom"} />
            </>
          )}
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
      </NodeContext.Provider>
    </>
  );
}

export default memo(NodeFrame);
