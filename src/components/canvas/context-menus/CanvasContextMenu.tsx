import { useViewport } from "@xyflow/react";
import prebuiltNodesConfig from "../../nodes/prebuilt-nodes/prebuiltNodesConfig";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import { useTemplateStore } from "@/stores/templateStore";
import type { Id } from "convex/_generated/dataModel";
import { useCreateNode } from "@/hooks/useCreateNode";

export default function ContextMenu({
  closeMenu,
  position,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
}) {
  const { createNode } = useCreateNode();
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
      <DropdownMenuSeparator />
      {prebuiltNodesConfig.map((nodeConfig, i) => {
        const Icon = nodeConfig.nodeIcon;
        return (
          <DropdownMenuItem
            key={i}
            className="w-48"
            onClick={async () => {
              await createNode({
                node: nodeConfig.node,
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
      {/* <DropdownMenuSeparator /> */}

      {/* <DropdownMenuLabel>Blocs personnalisés</DropdownMenuLabel>
      {templates.map((template, i) => {
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
        const rootData = layout?.data as Record<string, unknown> | undefined;

        // Parse default dimensions (stored as "150px" -> 150)
        const defaultWidth = rootData?.defaultWidth
          ? parseInt(String(rootData.defaultWidth).replace("px", ""))
          : 200;
        const defaultHeight = rootData?.defaultHeight
          ? parseInt(String(rootData.defaultHeight).replace("px", ""))
          : 150;

        return (
          <DropdownMenuItem
            key={i}
            className="w-48"
            onClick={async () => {
              await createNode({
                node: {
                  id: "",
                  type: "custom",
                  position: { x: 0, y: 0 },
                  data: {
                    name: template.name,
                    templateId: template._id as Id<"nodeTemplates">,
                    color: "default",
                    data: defaultData,
                  },
                  width: defaultWidth,
                  height: defaultHeight,
                },
                position: newNodePosition,
                skipNodeData: true,
              });
              closeMenu();
            }}
          >
            {template.name}
          </DropdownMenuItem>
        );
      })} */}
    </>
  );
}
