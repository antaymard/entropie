import { useViewport, useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "../../../stores/canvasStore";
import prebuiltNodesConfig from "../../nodes/prebuilt-nodes/prebuiltNodesConfig";
import type { NodeColors } from "../../../types/node.types";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";

export default function ContextMenu({
  closeMenu,
  position,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
}) {
  const { setNodes, addNodes } = useReactFlow();
  const { x: canvasX, y: canvasY, zoom: canvasZoom } = useViewport();

  const newNodePosition = {
    x: (-canvasX + position.x) / canvasZoom,
    y: (-canvasY + position.y) / canvasZoom,
  };

  // On est déjà dans DropdownMenuContent

  return (
    <>
      <DropdownMenuLabel>Ajouter un bloc</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {prebuiltNodesConfig.map((nodeType) => (
        <DropdownMenuItem
          key={nodeType.type}
          className="whitespace-nowrap"
          onClick={() => {
            const newNodeId = `node-${Date.now()}`;

            // Ajouter le nouveau node dans le state Zustand (DB)
            addNodes({
              id: newNodeId,
              ...nodeType.initialValues,
              type: nodeType.type,
              position: newNodePosition,
            });

            // Sélectionner uniquement le nouveau node dans le state React Flow
            // setTimeout pour laisser React Flow se synchroniser avec Zustand
            setTimeout(() => {
              setNodes((nodes) =>
                nodes.map((n) => ({
                  ...n,
                  selected: n.id === newNodeId,
                }))
              );
            }, 0);

            closeMenu();
          }}
        >
          {nodeType.nodeIcon} {nodeType.addButtonLabel}
        </DropdownMenuItem>
      ))}
    </>
  );
}
