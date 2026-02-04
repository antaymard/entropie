import { NodeToolbar, type Node, useStore } from "@xyflow/react";
import { memo } from "react";
import ColorSelector from "./ColorSelector";
import prebuiltNodesConfig from "../prebuilt-nodes/prebuiltNodesConfig";
import AutomationSettingsButton from "./AutomationSettingsButton";

const selectedNodesCountSelector = (state: { nodes: Node[] }) =>
  state.nodes.filter((node) => node.selected).length;

function CanvasNodeToolbar({
  children,
  xyNode,
  className,
}: {
  children?: React.ReactNode;
  xyNode: Node;
  className?: string;
}) {
  const selectedNodesCount = useStore(selectedNodesCountSelector);

  // Early return si le node n'est pas sélectionné
  if (!xyNode?.selected) {
    return null;
  }

  const isVisible = !xyNode.dragging && selectedNodesCount === 1;
  const nodeConfig = prebuiltNodesConfig.find(
    (config) => config.node.type === xyNode.type,
  );

  return (
    <NodeToolbar
      onContextMenu={(e) => e.stopPropagation()}
      isVisible={isVisible}
      className={`flex gap-2 ${className || ""}`}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {children}
      {nodeConfig?.canHaveAutomation && (
        <AutomationSettingsButton xyNode={xyNode} />
      )}
      <ColorSelector xyNode={xyNode} />
    </NodeToolbar>
  );
}

export default memo(CanvasNodeToolbar);
