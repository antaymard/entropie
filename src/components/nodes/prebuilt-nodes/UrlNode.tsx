import type { Node } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import { useNode } from "@/stores/canvasStore";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";

export default function UrlNode(xyNode: Node) {
  const canvasNode = useNode(xyNode.id);

  if (!canvasNode) return <p>Introuvable</p>;
  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode} />
      <NodeFrame xyNode={xyNode} showNodeName>
        blabla
      </NodeFrame>
    </>
  );
}
