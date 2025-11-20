import { nodeList } from "@/components/nodes/nodeTypes";
import type { Window } from "@/types/windows.types";
import { useNodesData } from "@xyflow/react";
import nodeColors from "../../nodes/nodeColors";
import type { NodeColors, NodeConfig } from "@/types/node.types";
import { useWindowsStore } from "@/stores/windowsStore";
import { FaRegCircleXmark } from "react-icons/fa6";

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

  function handleClose() {
    closeWindow(window.id);
  }

  return (
    <div
      className={`cursor-pointer flex items-center gap-2 h-8 border px-2 rounded-sm ${nodeColorClassNames.border} ${nodeColorClassNames.bg} ${nodeColorClassNames.text}`}
      onClick={() => toggleMinimizeWindow(window.id, false)}
    >
      <div className="flex items-center gap-1">
        {nodeConfig?.nodeIcon && null}
        {data?.name}
      </div>
      <button type="button" onClick={handleClose} className="">
        <FaRegCircleXmark size={18} />
      </button>
    </div>
  );
}
