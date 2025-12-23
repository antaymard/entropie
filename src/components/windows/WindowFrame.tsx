import { useWindowsStore } from "@/stores/windowsStore";
import { memo } from "react";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { useShallow } from "zustand/react/shallow";
import { TbWindowMinimize } from "react-icons/tb";
import { useReactFlow } from "@xyflow/react";
import InlineEditableText from "../form-ui/InlineEditableText";
import type { NodeColors } from "@/types/node.types";
import nodeColors from "../nodes/nodeColors";
import { HiMiniXMark } from "react-icons/hi2";
import prebuiltNodesConfig from "../nodes/prebuilt-nodes/prebuiltNodesConfig";
import { cn } from "@/lib/utils";

interface WindowFrameProps {
  windowId: string;
  children?: React.ReactNode;
  contentClassName?: string;
  floatable?: boolean;
}

function getNodeColorClasses(color: NodeColors) {
  return nodeColors[color] || nodeColors["default"];
}

function WindowFrame({
  windowId,
  children,
  contentClassName,
  floatable = true,
}: WindowFrameProps) {
  const { handleMouseDown } = useWindowDrag(windowId);
  const { getNode } = useReactFlow();
  const { updateNodeData } = useReactFlow();

  // Sélecteur optimisé avec shallow comparison
  const window = useWindowsStore(useShallow((state) => state.openWindows));

  const closeWindow = useWindowsStore((state) => state.closeWindow);
  // const toggleMinimizeWindow = useWindowsStore(
  //   (state) => state.toggleMinimizeWindow
  // );
  const node = getNode(windowId);

  if (!window || !node) return null;

  const nodeColor = getNodeColorClasses(node.data?.color as NodeColors);

  const handleNameSave = (newName: string) => {
    updateNodeData(node.id, { name: newName });
  };

  const { position, width, height, isMinimized, isExpanded } = window;

  if (isMinimized) return null;

  const Icon = prebuiltNodesConfig.find((n) => n.type === node.type)?.nodeIcon;

  return (
    <div
      className={cn(
        floatable &&
          "absolute pointer-events-auto rounded-[10px] grid grid-cols-[7px_1fr_7px] grid-rows-[7px_1fr_7px]",
        !floatable && "h-full"
      )}
      style={
        floatable
          ? {
              transform: `translate(${position?.x}px, ${position?.y}px)`,
              width: `${width}px`,
              height: `${height - 10}px`,
            }
          : {}
      }
    >
      {/* Top-left corner */}
      {floatable && (
        <>
          <div
            className="cursor-nwse-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "tl")}
          />
          {/* Top center */}
          <div
            className="cursor-ns-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "tc")}
          />
          {/* Top-right corner */}
          <div
            className="cursor-nesw-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "tr")}
          />

          {/* Middle-left */}
          <div
            className="cursor-ew-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "ml")}
          />
        </>
      )}

      {/* WINDOW CONTENT */}
      <div
        className={cn(
          "p-0.5 border rounded inline-flex flex-col h-full w-full shadow backdrop-blur-xs ",
          floatable && "cursor-grab",
          nodeColor.border,
          nodeColor.transparentBg
        )}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-1"
          onMouseDown={(e) => {
            if (!floatable) return;
            e.stopPropagation();
            handleMouseDown(e, "move");
          }}
        >
          <div className={"flex gap-1 " + nodeColor.text}>
            {Icon && <Icon size={18} className="mb" />}
            <InlineEditableText
              value={String(node?.data.name) || "Sans nom"}
              onSave={handleNameSave}
              className="font-semibold text-sm w-full truncate mt-[1px]"
              placeholder="Nom du bloc"
            />
          </div>
          <div className="flex items-center gap-1">
            {floatable && (
              <button
                type="button"
                // onClick={() => toggleMinimizeWindow(windowId, true)}
                className="text-gray-500 h-6 w-6 flex items-center justify-center rounded hover:bg-white/40"
              >
                <TbWindowMinimize size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => closeWindow(windowId)}
              className="text-gray-500 h-6 w-6 flex items-center justify-center rounded hover:bg-white/40"
            >
              <HiMiniXMark size={20} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className={
            "bg-white h-full rounded-md p-3 border border-gray-200 cursor-auto overflow-auto " +
            contentClassName
          }
          style={
            floatable
              ? {}
              : {
                  width: width - 16,
                  height: height - 16 - 28 - 8,
                }
          }
        >
          {children}
        </div>
      </div>

      {/* Middle-right */}
      {floatable && (
        <>
          <div
            className="cursor-ew-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "mr")}
          />

          {/* Bottom-left corner */}
          <div
            className="cursor-nesw-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "bl")}
          />
          {/* Bottom center */}
          <div
            className="cursor-ns-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "bc")}
          />
          {/* Bottom-right corner */}
          <div
            className="cursor-nwse-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "br")}
          />
        </>
      )}
    </div>
  );
}

export default memo(WindowFrame);
