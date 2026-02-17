import { useViewport } from "@xyflow/react";
import prebuiltNodesConfig from "../../nodes/prebuilt-nodes/prebuiltNodesConfig";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import { useCreateNode } from "@/hooks/useCreateNode";

export default function ContextMenu({
  closeMenu,
  position,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
}) {
  const { createNode } = useCreateNode();
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
      {prebuiltNodesConfig.map((nodeConfig, i) => {
        const Icon = nodeConfig.nodeIcon;
        return (
          <DropdownMenuItem
            key={i}
            className="w-48"
            onClick={async () => {
              // Utiliser les dimensions du variant "default" s'il existe
              const nodeToCreate = { ...nodeConfig.node };
              if (nodeConfig.variants?.default) {
                nodeToCreate.height = nodeConfig.variants.default.defaultHeight;
                nodeToCreate.width = nodeConfig.variants.default.defaultWidth;
              }

              await createNode({
                node: nodeToCreate,
                position: newNodePosition,
                skipNodeDataCreation: nodeConfig.skipNodeDataCreation,
              });
              closeMenu();
            }}
          >
            <Icon /> {nodeConfig.nodeLabel}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
