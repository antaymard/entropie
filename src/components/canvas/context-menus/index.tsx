import type { Node } from "@xyflow/react";
import CanvasContextMenu from "./CanvasContextMenu";
import EdgeContextMenu from "./EdgeContextMenu";
import NodeContextMenu from "./NodeContextMenu";
import { DropdownMenu, DropdownMenuContent, } from "@/components/shadcn/dropdown-menu";


export default function ContextMenuWrapper({
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
    element: object | null | Node;
  }) => void;
}) {
  const { type, position, element } = contextMenu;
  const contextMenuOffset = 10; // Pour décaler un peu le menu du curseur

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
        return <NodeContextMenu closeMenu={handleClose} position={position} xyNode={element as Node} />;
      case "edge":
        return <EdgeContextMenu />;
      default:
        return null;
    }
  }

  return <DropdownMenu open={contextMenu.type !== null} onOpenChange={open => { if (!open) handleClose() }}>
    <DropdownMenuContent
      style={{
        position: 'fixed',
        top: position.y + contextMenuOffset,
        left: position.x + contextMenuOffset,
      }}
      onContextMenu={e => e.preventDefault()}
    >

      {renderContextMenu()}
    </DropdownMenuContent>
  </DropdownMenu>


}
