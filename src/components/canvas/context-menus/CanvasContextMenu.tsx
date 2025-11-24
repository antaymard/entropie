import { useViewport, useReactFlow } from "@xyflow/react";
import prebuiltNodesConfig from "../../nodes/prebuilt-nodes/prebuiltNodesConfig";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import { toXyNode } from "@/components/utils/nodeUtils";
import { useTemplateStore } from "@/stores/templateStore";
import type { Id } from "convex/_generated/dataModel";

export default function ContextMenu({
  closeMenu,
  position,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
}) {
  const { setNodes, addNodes } = useReactFlow();
  const templates = useTemplateStore((state) => state.templates);
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
      {prebuiltNodesConfig.map((nodeType) => {
        const Icon = nodeType.nodeIcon;
        return (
          <DropdownMenuItem
            key={nodeType.type}
            className="w-48"
            onClick={() => {
              const newNodeId = `node-${crypto.randomUUID()}`;

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
            <Icon /> {nodeType.nodeLabel}
          </DropdownMenuItem>
        );
      })}
      <DropdownMenuSeparator />

      <DropdownMenuLabel>Blocs personnalisés</DropdownMenuLabel>
      {templates.map((template, i) => (
        <DropdownMenuItem
          key={i}
          className="w-48"
          onClick={() => {
            const newNodeId = `node-${crypto.randomUUID()}`;

            // Créer l'objet data avec les valeurs par défaut de chaque field
            const defaultData: Record<string, unknown> = {};
            template.fields.forEach((field) => {
              if (field.options?.defaultValue !== undefined) {
                defaultData[field.id] = field.options.defaultValue;
              }
            });

            addNodes({
              id: newNodeId,
              type: "custom",
              data: {
                name: template.name,
                templateId: template._id as Id<"nodeTemplates">,
                color: "default",
                data: defaultData,
              },
              position: newNodePosition,
            });
          }}
        >
          {template.name}
        </DropdownMenuItem>
      ))}
    </>
  );
}
