import { useViewport, useReactFlow } from "@xyflow/react";
import prebuiltNodesConfig from "../../nodes/prebuilt-nodes/prebuiltNodesConfig";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import { useTemplateStore } from "@/stores/templateStore";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

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

  const createNodeData = useMutation(api.nodeDatas.create);

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
      {prebuiltNodesConfig.map((nodeConfig, i) => {
        const Icon = nodeConfig.nodeIcon;
        return (
          <DropdownMenuItem
            key={i}
            className="w-48"
            onClick={async () => {
              const newNodeId = `${crypto.randomUUID()}`;

              const nodeDataId = await createNodeData({
                type: nodeConfig.node.type,
                values: {},
                updatedAt: Date.now(),
              });

              addNodes({
                ...nodeConfig.node,
                id: newNodeId,
                position: newNodePosition,
                data: {
                  ...nodeConfig.node.data,
                  nodeDataId,
                },
              });

              // Sélectionner uniquement le nouveau node dans le state React Flow
              // setTimeout pour laisser React Flow se synchroniser avec Zustand
              setTimeout(() => {
                setNodes((nodes) =>
                  nodes.map((n) => ({
                    ...n,
                    selected: n.id === newNodeId,
                  })),
                );
              }, 0);

              closeMenu();
            }}
          >
            <Icon /> {nodeConfig.nodeLabel}
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
            const newNodeId = `${crypto.randomUUID()}`;

            // Créer l'objet data avec les valeurs par défaut de chaque field
            const defaultData: Record<string, unknown> = {};
            template.fields.forEach((field) => {
              if (field.options?.defaultValue !== undefined) {
                defaultData[field.id] = field.options.defaultValue;
              }
            });

            // Get default dimensions from the template's node layout
            const defaultVariantId = template.defaultVisuals.node || "default";
            const layout = template.visuals.node?.[defaultVariantId]?.layout;
            const rootData = layout?.data as
              | Record<string, unknown>
              | undefined;

            // Parse default dimensions (stored as "150px" -> 150)
            const defaultWidth = rootData?.defaultWidth
              ? parseInt(String(rootData.defaultWidth).replace("px", ""))
              : 200;
            const defaultHeight = rootData?.defaultHeight
              ? parseInt(String(rootData.defaultHeight).replace("px", ""))
              : 150;

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
              width: defaultWidth,
              height: defaultHeight,
            });
          }}
        >
          {template.name}
        </DropdownMenuItem>
      ))}
    </>
  );
}
