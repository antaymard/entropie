import { NodeResizer, type Node } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { colors } from "../ui/styles";
import type { colorsEnum } from "@/types/style.types";

function NodeFrame({
  xyNode,
  children,
}: {
  xyNode: Node<any>;
  children: React.ReactNode;
}) {
  if (!xyNode) return null;

  const nodeColor = colors[(xyNode?.data?.color as colorsEnum) || "default"];
  const canDrag = true;

  return (
    <>
      <NodeResizer
        isVisible={xyNode?.selected}
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
          "relative rounded-[5px] bg-card text-card-foreground",
          "group h-full flex flex-col duration-150 border",
          nodeColor.nodeBg,
          nodeColor.nodeBorder,
          !canDrag && "nodrag",
          xyNode.selected
            ? "ring-2 ring-blue-500/70"
            : "hover:ring-1 hover:ring-blue-400/60",
        )}
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
