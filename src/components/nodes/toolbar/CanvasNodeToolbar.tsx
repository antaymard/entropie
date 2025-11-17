import { useNode } from "@/stores/canvasStore";
import { NodeToolbar, type Node, useStore } from "@xyflow/react";
import ColorSelector from "./ColorSelector";

export default function CanvasNodeToolbar({
  xyNode,
  children,
  ...props
}: {
  xyNode: Node;
  children?: React.ReactNode;
  className?: string;
}) {
  const canvasNode = useNode(xyNode.id);

  // Super optimized: only count selections when THIS node is selected
  const selectedCount = useStore((state) => {
    // Early exit if this node is not selected - don't track selection count
    if (!xyNode.selected) return 0;

    // Only count when this node is selected
    return state.nodes.filter((n) => n.selected).length;
  });

  const hasMultipleSelected = selectedCount > 1;

  if (!canvasNode) return null;
  return (
    <NodeToolbar
      isVisible={xyNode.selected && !xyNode.dragging && !hasMultipleSelected}
      {...props}
    >
      {children}
      <ColorSelector canvasNode={canvasNode} />
    </NodeToolbar>
  );
}
