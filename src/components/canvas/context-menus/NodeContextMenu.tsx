import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/shadcn/dropdown-menu";
import { useCreateNode } from "@/hooks/useCreateNode";
import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useParams } from "@tanstack/react-router";
import type { Id } from "@/../convex/_generated/dataModel";

// Icons
import { HiOutlineTrash } from "react-icons/hi";
import { TbCopyPlus, TbCopyPlusFilled, TbSpaces } from "react-icons/tb";
import { useUpdateCanvasNode } from "@/hooks/useUpdateCanvasNode";

const variantDimensions: Record<string, Record<string, { width: number; height: number }>> = {
  link: {
    default: { width: 220, height: 33 },
    preview: { width: 280, height: 260 },
  },
  document: {
    default: { width: 320, height: 320 },
    title: { width: 220, height: 33 },
  },
};

export default function NodeContextMenu({
  closeMenu,
  position,
  xyNode,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
  xyNode: Node;
}) {
  const { deleteElements, setNodes } = useReactFlow();
  const { createNode } = useCreateNode();
  const { updateCanvasNode } = useUpdateCanvasNode();
  const { canvasId }: { canvasId: Id<"canvases"> } = useParams({
    from: "/canvas/$canvasId",
  });
  const updatePositionOrDimensions = useMutation(
    api.canvasNodes.updatePositionOrDimensions,
  );

  const variants = prebuiltNodesConfig.find(
    (config) => config.node.type === xyNode.type,
  )?.variants;

  const nodeOptions = [
    {
      hidden: !variants || variants.length === 0,
      label: "Apparence",
      icon: TbSpaces,
      subMenu:
        variants?.map((variant) => ({
          label: {
            title: "Titre seul",
            default: "Affichage",
            preview: "Aperçu",
          }[variant],
          onClick: () => {
            updateCanvasNode({
              nodeId: xyNode.id,
              props: { variant },
            });

            const dimensions =
              xyNode.type && variantDimensions[xyNode.type]?.[variant];
            if (dimensions) {
              setNodes((nodes) =>
                nodes.map((n) =>
                  n.id === xyNode.id
                    ? {
                        ...n,
                        width: dimensions.width,
                        height: dimensions.height,
                      }
                    : n,
                ),
              );
              updatePositionOrDimensions({
                canvasId,
                nodeChanges: [{ id: xyNode.id, dimensions }],
              });
            }
          },
        })) || [],
    },
    {
      label: "Dupliquer",
      icon: TbCopyPlus,
      onClick: () => {
        const nodeToDuplicate = xyNode;
        if (nodeToDuplicate) {
          const nodeConfig = prebuiltNodesConfig.find(
            (config) => config.node.type === nodeToDuplicate.type,
          );

          createNode({
            node: nodeToDuplicate,
            position: {
              x: nodeToDuplicate.position.x + 50,
              y: nodeToDuplicate.position.y + 50,
            },
            skipNodeDataCreation: nodeConfig?.skipNodeDataCreation || false,
          });
        }
      },
    },
    {
      label: "Dupliquer Synchro",
      icon: TbCopyPlusFilled,
      onClick: () => {
        const nodeToDuplicate = xyNode;
        if (nodeToDuplicate) {
          createNode({
            node: nodeToDuplicate,
            position: {
              x: nodeToDuplicate.position.x + 50,
              y: nodeToDuplicate.position.y + 50,
            },
            skipNodeDataCreation: true,
          });
        }
      },
    },
    {
      label: "Supprimer",
      icon: HiOutlineTrash,
      onClick: () => {
        deleteElements({ nodes: [xyNode] });
      },
    },
  ];
  // On est déjà dans DropdownMenuContent

  return (
    <>
      <DropdownMenuLabel className="whitespace-nowrap">
        Actions sur le bloc
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {nodeOptions
        .filter((option) => option.hidden !== true)
        .map((option, i) =>
          option.subMenu && option.subMenu.length > 0 ? (
            <DropdownMenuSub key={i}>
              <DropdownMenuSubTrigger className="whitespace-nowrap">
                {option.icon({ size: 16 })} {option.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {option.subMenu.map((sub, j) => (
                  <DropdownMenuItem
                    className="whitespace-nowrap"
                    key={j}
                    onClick={() => {
                      sub.onClick();
                      closeMenu();
                    }}
                  >
                    {sub.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem
              className="whitespace-nowrap"
              key={i}
              onClick={() => {
                option.onClick?.();
                closeMenu();
              }}
            >
              {option.icon({ size: 16 })} {option.label}
            </DropdownMenuItem>
          ),
        )}
    </>
  );
}
