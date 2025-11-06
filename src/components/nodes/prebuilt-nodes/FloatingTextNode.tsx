import { memo } from "react";
import { useNode } from "../../../stores/canvasStore";
import { type Node } from "@xyflow/react";
import NodeFrame from "../NodeFrame";

function FloatingTextNode(xyNode: Node) {
  const canvasNode = useNode(xyNode.id);
  if (!canvasNode) return null;

  return <NodeFrame xyNode={xyNode}>{canvasNode?.data?.text}</NodeFrame>;
}

export default memo(FloatingTextNode);
