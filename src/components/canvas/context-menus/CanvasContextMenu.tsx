import { useViewport, useReactFlow } from "@xyflow/react";
import prebuiltNodesConfig from "../../nodes/prebuilt-nodes/prebuiltNodesConfig";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import { toXyNode } from "@/components/utils/nodeUtils";

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
      <DropdownMenuLabel className="whitespace-nowrap">
        Ajouter un bloc
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {prebuiltNodesConfig.map((nodeType) => (
        <DropdownMenuItem
          key={nodeType.type}
          className="w-48"
          onClick={() => {
            const newNodeId = `node-${Date.now()}`;

            // Ajouter le nouveau node dans le state Zustand (DB)
            addNodes({
              ...toXyNode(nodeType.initialNodeValues),
              id: newNodeId,
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
          {nodeType.nodeIcon} {nodeType.nodeLabel}
        </DropdownMenuItem>
      ))}
    </>
  );
}
