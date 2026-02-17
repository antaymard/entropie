import type { Node } from "@xyflow/react";

/**
 * Custom comparator for React.memo on ReactFlow node components.
 * ReactFlow passes internal props (measured, internals, etc.) that change
 * on every render cycle, defeating memo's shallow comparison.
 * This comparator only checks the props that actually affect rendering.
 */
export function areNodePropsEqual(prev: Node, next: Node): boolean {
  return (
    prev.id === next.id &&
    prev.data === next.data &&
    prev.selected === next.selected &&
    prev.dragging === next.dragging &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.type === next.type
  );
}
