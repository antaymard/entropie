import { useViewport } from "@xyflow/react";
import { contextMenuButtonClassName, contextMenuContainerClassName } from ".";
import { useCanvasStore } from "../../../stores/canvasStore";
import prebuiltNodesList from "../../nodes/prebuilt-nodes/prebuiltNodesList";
import type { NodeColors } from "../../../types/node.types";

export default function ContextMenu({
  closeMenu,
  position,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
}) {
  const addNode = useCanvasStore((state) => state.addNode);
  const { x: canvasX, y: canvasY, zoom: canvasZoom } = useViewport();

  const newNodePosition = {
    x: (-canvasX + position.x) / canvasZoom,
    y: (-canvasY + position.y) / canvasZoom,
  };

  return (
    <div className={contextMenuContainerClassName}>
      {prebuiltNodesList.map((nodeType) => (
        <button
          key={nodeType.type}
          className={contextMenuButtonClassName}
          onClick={() => {
            addNode({
              id: `node-${Date.now()}`,
              ...nodeType.initialValues,
              type: nodeType.type,
              position: newNodePosition,
              color: nodeType.initialValues.color as NodeColors,
            });
            closeMenu();
          }}
        >
          {nodeType.addButtonIcon} {nodeType.addButtonLabel}
        </button>
      ))}
    </div>
  );
}
