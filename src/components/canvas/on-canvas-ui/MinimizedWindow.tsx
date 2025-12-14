import { nodeList } from "@/components/nodes/nodeTypes";
import type { Window } from "@/types/windows.types";
import { useNodesData } from "@xyflow/react";
import nodeColors from "../../nodes/nodeColors";
import type { NodeColors, NodeConfig } from "@/types/node.types";
import { useWindowsStore } from "@/stores/windowsStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { Button } from "@/components/shadcn/button";
import { HiMiniXMark } from "react-icons/hi2";
import { TbTemplate } from "react-icons/tb";

export default function MinimizedWindow({ window }: { window: Window }) {
  const closeWindow = useWindowsStore((state) => state.closeWindow);
  const toggleMinimizeWindow = useWindowsStore(
    (state) => state.toggleMinimizeWindow
  );

  const nodeConfig = nodeList.find(
    (node) => node.type === window.type
  ) as NodeConfig;
  const nodeData = useNodesData(window.id);
  const { data } = nodeData || {};
  const nodeColorClassNames =
    nodeColors[(data?.color as NodeColors) || "default"];

  const Icon = nodeConfig?.nodeIcon || TbTemplate;

  return (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>
        <div className="relative group">
          <Button
            type="button"
            onClick={() => toggleMinimizeWindow(window.id, !window.isMinimized)}
            className={window.isMinimized ? "" : "bg-accent"}
            variant="ghost"
          >
            {Icon && <Icon size={20} />}
          </Button>
          <button
            className="hidden group-hover:flex h-4 w-4 rounded-full p-0 m-0 aspect-square  items-center justify-center absolute bg-red-400 text-white top-0 right-0"
            onClick={() => closeWindow(window.id)}
          >
            <HiMiniXMark size={12} />
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent align="start">{data?.name}</TooltipContent>
    </Tooltip>
  );
}
