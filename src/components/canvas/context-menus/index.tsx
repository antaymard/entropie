import CanvasContextMenu from "./CanvasContextMenu";
import EdgeContextMenu from "./EdgeContextMenu";
import NodeContextMenu from "./NodeContextMenu";

export const contextMenuContainerClassName = "flex flex-col p-1 gap-1 ";
export const contextMenuButtonClassName =
  "hover:bg-gray-200 p-2 rounded-sm flex items-center gap-2";

export default function ContextMenu({
  contextMenu,
  setContextMenu,
}: {
  contextMenu: {
    type: "node" | "edge" | "canvas" | null;
    position: { x: number; y: number };
    element: object | null;
  };
  setContextMenu: (contextMenu: {
    type: "node" | "edge" | "canvas" | null;
    position: { x: number; y: number };
    element: object | null;
  }) => void;
}) {
  const { type, position, element } = contextMenu;

  const handleClose = () => {
    setContextMenu({ type: null, position: { x: 0, y: 0 }, element: null });
  };

  function renderContextMenu() {
    switch (type) {
      case "canvas":
        return (
          <CanvasContextMenu closeMenu={handleClose} position={position} />
        );
      case "node":
        return <NodeContextMenu />;
      case "edge":
        return <EdgeContextMenu />;
      default:
        return null;
    }
  }

  return (
    <>
      <div
        className="fixed inset-0"
        onClick={(e) => {
          e.stopPropagation();
          setContextMenu({
            type: null,
            position: { x: 0, y: 0 },
            element: null,
          });
        }}
      />
      <div
        className="bg-white rounded-md border border-gray-300 absolute"
        style={{
          top: position.y,
          left: position.x,
        }}
      >
        {renderContextMenu()}
      </div>
    </>
  );
}
