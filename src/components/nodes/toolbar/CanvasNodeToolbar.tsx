import { NodeToolbar, type Node, useStore } from "@xyflow/react";
import { memo } from "react";
import ColorSelector from "./ColorSelector";

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
  if (!xyNode.selected) {
    return null;
  }

  const isVisible = !xyNode.dragging && selectedNodesCount === 1;

  return (
    <NodeToolbar
      isVisible={isVisible}
      className={`flex gap-2 ${className || ""}`}
    >
      {children}
      <ColorSelector xyNode={xyNode} />
    </NodeToolbar>
  );
}

export default memo(CanvasNodeToolbar);
