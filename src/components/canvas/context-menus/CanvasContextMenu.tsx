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

  return (
    <div className={contextMenuContainerClassName}>
      <button
        className={contextMenuButtonClassName}
        onClick={() => {
          addNode({
            id: `node-${Date.now()}`,
            type: "default",
            position,
            data: { label: "Nouveau node" },
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
