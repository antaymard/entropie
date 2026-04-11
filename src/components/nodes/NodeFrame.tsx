import { NodeResizer, type Node } from "@xyflow/react";
import { memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { colors } from "@/components/ui/styles";
import type { colorsEnum } from "@/types/domain";
import type { Id } from "@/../convex/_generated/dataModel";
import NodeHandles from "./NodeHandles";
import AutomationIndicator from "./toolbar/AutomationIndicator";
import { useWindowsStore } from "@/stores/windowsStore";
import { canNodeTypeBeOpenedInWindow } from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import { useIsNodeAttached } from "@/stores/noleStore";

function NodeFrame({
  xyNode,
  children,
  resizable = true,
}: {
  xyNode: Node<any>;
  children: React.ReactNode;
  resizable?: boolean;
}) {
  const nodeColor = colors[(xyNode?.data?.color as colorsEnum) || "default"];
  const canDrag = true;
  const openWindow = useWindowsStore((state) => state.openWindow);
  const isAttachedToNole = useIsNodeAttached(xyNode.id);

  const handleDoubleClick = useCallback(() => {
    const nodeType = xyNode.type;
    const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;

    if (nodeDataId && canNodeTypeBeOpenedInWindow(nodeType)) {
      openWindow({
        xyNodeId: xyNode.id,
        nodeDataId,
        nodeType: nodeType as any,
      });
    }
  }, [xyNode, openWindow]);

  if (!xyNode) return null;
  return (
    <>
      <NodeHandles showSourceHandles={xyNode?.selected} nodeId={xyNode.id} />
      <AutomationIndicator xyNode={xyNode} />
      <NodeResizer
        isVisible={resizable && xyNode?.selected}
        lineStyle={{
          borderWidth: 2,
        }}
        handleStyle={{
          height: 8,
          width: 8,
          borderRadius: 2,
          zIndex: 10,
        }}
      />
      <div
        className={cn(
          "relative rounded-[5px] text-card-foreground",
          "group h-full flex flex-col duration-150 border",
          nodeColor.nodeBg,
          nodeColor.nodeBorder,
          isAttachedToNole &&
            "after:pointer-events-none after:absolute after:-inset-1 after:rounded-[8px] after:border-2 after:border-dashed after:border-violet-500/90",
          !canDrag && "nodrag",
          xyNode.selected
            ? "ring-2 ring-blue-500/70"
            : "hover:ring-1 hover:ring-blue-400/60",
        )}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className={cn(
            "h-full rounded-[4px]",
            xyNode.data.color === "transparent"
              ? "bg-transparent"
              : "bg-white/80",
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export default memo(NodeFrame);
