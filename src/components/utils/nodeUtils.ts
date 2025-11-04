import type { CanvasNode } from "../../types/node.types";

/**
 * Converts a node from DB format to ReactFlow format
 * Handles the locked property and derives ReactFlow interaction booleans
 */
export function toReactFlowNode(dbNode: Partial<CanvasNode>): CanvasNode {
  const locked = dbNode.locked ?? false;
  return {
    ...dbNode,
    // ReactFlow interaction properties derived from locked
    focusable: !locked,
    draggable: !locked,
    selectable: true,
    connectable: !locked,
    deletable: !locked,
    locked,
    selected: false,
    color: dbNode.color ?? "default",
    hidden: dbNode.hidden ?? false,
  } as CanvasNode;
}

/**
 * Converts a node from ReactFlow format to DB format
 * Strips ReactFlow-specific metadata
 */
export function toDbNode(
  reactFlowNode: CanvasNode
): Omit<
  CanvasNode,
  | "resizing"
  | "dragging"
  | "selected"
  | "focusable"
  | "draggable"
  | "selectable"
  | "connectable"
  | "deletable"
  | "measured"
> {
  const {
    resizing,
    dragging,
    selected,
    focusable,
    draggable,
    selectable,
    connectable,
    deletable,
    measured,
    ...dbNode
  } = reactFlowNode;
  return dbNode;
}
