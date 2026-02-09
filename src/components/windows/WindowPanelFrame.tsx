import type { colorsEnum } from "@/types/domain";
import { colors } from "@/components/ui/styles";
import { cn } from "@/lib/utils";
import { type Node } from "@xyflow/react";
import CanvasNodeToolbar from "../nodes/toolbar/CanvasNodeToolbar";
import { TbX } from "react-icons/tb";
import { Button } from "@/components/shadcn/button";
import { useWindowsStore } from "@/stores/windowsStore";

export default function WindowPanelFrame({
  xyNode,
  title,
  children,
}: {
  xyNode: Node;
  title: string;
  children: React.ReactNode;
}) {
  const nodeColor = colors[(xyNode?.data?.color as colorsEnum) || "default"];

  const closeAllWindows = useWindowsStore((s) => s.closeAllWindows);

  return (
    <div
      className={cn(
        "h-full w-full md:rounded-lg border shadow-2xl",
        nodeColor.nodeBg,
        nodeColor.nodeBorder,
      )}
    >
      <div
        className={cn(
          "bg-white",
          "h-full rounded-[8px] p-3 flex flex-col gap-3",
        )}
      >
        <div className="flex items-center justify-between shrink-0">
          <CanvasNodeToolbar xyNode={xyNode} asSimpleDiv />
          <Button variant="outline" size="icon" onClick={closeAllWindows}>
            <TbX />
          </Button>
        </div>
        <div className={cn("flex-1 overflow-auto")}>{children}</div>
      </div>
    </div>
  );
}
