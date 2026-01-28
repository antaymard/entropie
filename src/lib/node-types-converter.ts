import type { CanvasNode } from "@/types";
import type { Node } from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";

export function fromXyNodeToCanvasNode(xyNode: Node): CanvasNode {
  const { nodeDataId, ...restData } = (xyNode.data ?? {}) as {
    nodeDataId?: Id<"nodeDatas">;
    [key: string]: unknown;
  };

  if (!nodeDataId) {
    throw new Error(`Node ${xyNode.id} is missing nodeDataId in data`);
  }

  return {
    id: xyNode.id,
    nodeDataId,
    type: xyNode.type ?? "default",
    position: xyNode.position,
    width: xyNode.measured?.width ?? xyNode.width ?? 0,
    height: xyNode.measured?.height ?? xyNode.height ?? 0,
    locked: xyNode.draggable === false,
    hidden: xyNode.hidden ?? false,
    zIndex: xyNode.zIndex ?? 0,
    data: restData,
    ...(xyNode.parentId && { parentId: xyNode.parentId }),
    ...(xyNode.extent && { extent: xyNode.extent }),
    ...(xyNode.expandParent && { extendParent: xyNode.expandParent }),
  };
}

export function fromXyNodesToCanvasNodes(xyNodes: Node[]): CanvasNode[] {
  return xyNodes.map(fromXyNodeToCanvasNode);
}

export function fromCanvasNodeToXyNode(canvasNode: CanvasNode): Node {
  return {
    id: canvasNode.id,
    type: canvasNode.type,
    position: canvasNode.position,
    width: canvasNode.width,
    height: canvasNode.height,
    draggable: !canvasNode.locked,
    hidden: canvasNode.hidden,
    zIndex: canvasNode.zIndex,
    data: {
      nodeDataId: canvasNode.nodeDataId,
      ...canvasNode.data,
    },
    ...(canvasNode.parentId && { parentId: canvasNode.parentId }),
    ...(canvasNode.extent && { extent: canvasNode.extent }),
    ...(canvasNode.extendParent && { expandParent: canvasNode.extendParent }),
  };
}

export function fromCanvasNodesToXyNodes(canvasNodes: CanvasNode[]): Node[] {
  return canvasNodes.map(fromCanvasNodeToXyNode);
}
