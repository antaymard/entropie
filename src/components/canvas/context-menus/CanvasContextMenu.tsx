import { useViewport } from "@xyflow/react";
import { contextMenuButtonClassName, contextMenuContainerClassName } from ".";
import { useCanvasStore } from "../../../stores/canvasStore";

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
      <button
        className={contextMenuButtonClassName}
        onClick={() => {
          addNode({
            id: `node-${Date.now()}`,
            type: "default",
            position: newNodePosition,
            data: { label: "Nouveau node" },
            width: 150,
            height: 150,
          });
          closeMenu();
        }}
      >
        Ajouter un node
      </button>
      <button className={contextMenuButtonClassName}>
        Ajouter un autre node
      </button>
    </div>
  );
}
