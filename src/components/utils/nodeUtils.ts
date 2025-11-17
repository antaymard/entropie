import type { Node } from "@xyflow/react";
import type { CanvasNode, NodeColors } from "../../types/node.types";

/**
 * Converts a partial CanvasNode (from DB) to ReactFlow Node format
 * - Fills in default values for missing properties
 * - locked -> draggable, connectable, deletable, focusable (native ReactFlow props)
 * - color -> data.color (ReactFlow doesn't support color directly)
 */
export function toXyNode(canvasNode: Partial<CanvasNode>): Node {
  // const locked = canvasNode.locked ?? false;
  const locked = false;
  const color = canvasNode.color ?? ("default" as NodeColors);

  return {
    id: canvasNode.id ?? "",
    type: canvasNode.type ?? "default",
    position: canvasNode.position ?? { x: 0, y: 0 },
    width: canvasNode.width ?? 200,
    height: canvasNode.height ?? 100,
    zIndex: canvasNode.zIndex ?? 0,
    hidden: canvasNode.hidden ?? false,
    data: {
      ...(canvasNode.data ?? {}),
      color: color,
      name: canvasNode.name || "Sans nom",
      templateId: canvasNode.templateId || undefined,
    },
    parentId: canvasNode.parentId,
    extent: canvasNode.extent,
    expandParent: canvasNode.extendParent,
    // Native ReactFlow props derived from locked
    draggable: !locked, // Tous les nodes sont locked en db, à changer par la suite
    connectable: !locked,
    deletable: !locked,
    focusable: !locked,
    selectable: !locked, // Always allow selection
  };
}

/**
 * Converts a ReactFlow Node back to CanvasNode format
 * - Strips ReactFlow-specific metadata
 * - Converts native props back to custom props (draggable/connectable -> locked)
 * - Retrieves color from data.color
 */
export function toConvexNode(xyNode: Node): CanvasNode {
  // Récupération de la color depuis data
  const { color, ...otherData } = (xyNode.data ?? {}) as {
    color?: NodeColors;
    [key: string]: unknown;
  };

  // Déterminer locked depuis les props ReactFlow
  // Un node est locked si draggable ou connectable sont false
  const locked = !xyNode.draggable || !xyNode.connectable;

  return {
    id: xyNode.id,
    type: xyNode.type ?? "default",
    position: xyNode.position,
    name: xyNode.data?.name as string,
    templateId: xyNode.data?.templateId as string | undefined,
    width: xyNode.width ?? 200,
    height: xyNode.height ?? 100,
    zIndex: xyNode.zIndex ?? 0,
    color: color ?? "default",
    locked,
    hidden: xyNode.hidden ?? false,
    data: otherData,
    parentId: xyNode.parentId,
    extent: xyNode.extent,
    extendParent: xyNode.expandParent,
  };
}

/**
 * Converts an array of partial CanvasNodes to ReactFlow Node format
 */
export function toXyNodes(canvasNodes: Partial<CanvasNode>[]): Node[] {
  return canvasNodes.map(toXyNode);
}

/**
 * Converts an array of ReactFlow Nodes back to CanvasNode format
 */
export function toConvexNodes(xyNodes: Node[]): CanvasNode[] {
  return xyNodes.map(toConvexNode);
}
