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
import { useNodeDataStore } from "@/stores/nodeDataStore";

// Icons
import { HiOutlineTrash } from "react-icons/hi";
import {
  TbArrowLeftFromArc,
  TbCopyPlus,
  TbSpaces,
} from "react-icons/tb";
import { useUpdateCanvasNode } from "@/hooks/useUpdateCanvasNode";
import { useState } from "react";
import type { IconType } from "react-icons";
import MoveNodeToCanvasModal from "./MoveNodeToCanvasModal";
import { createPortal } from "react-dom";

type NodeSubMenuItem = {
  label: string;
  onClick: () => void | Promise<void>;
  preventAutoClose?: boolean;
};

type NodeOption = {
  hidden?: boolean;
  label: string;
  icon: IconType;
  subMenu?: NodeSubMenuItem[];
  onClick?: () => void | Promise<void>;
  preventAutoClose?: boolean;
};

export default function NodeContextMenu({
  closeMenu,
  xyNode,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
  xyNode: Node;
}) {
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const { deleteElements, updateNode } = useReactFlow();
  const { createNode } = useCreateNode();
  const { updateCanvasNode } = useUpdateCanvasNode();
  const { canvasId }: { canvasId: Id<"canvases"> } = useParams({
    from: "/canvas/$canvasId",
  });
  const updatePositionOrDimensions = useMutation(
    api.canvasNodes.updatePositionOrDimensions,
  );
  const getNodeData = useNodeDataStore((s) => s.getNodeData);

  const variants = prebuiltNodesConfig.find(
    (config) => config.node.type === xyNode.type,
  )?.variants;

  const nodeOptions: NodeOption[] = [
    {
      hidden: !variants || Object.keys(variants).length === 0,
      label: "Appearance",
      icon: TbSpaces,
      subMenu: Object.entries(variants || {}).map(
        ([variantKey, variantConfig]) => ({
          label: variantConfig.label,
          onClick: async () => {
            updateCanvasNode({
              nodeId: xyNode.id,
              props: { variant: variantKey },
            });

            const dimensions = {
              width: variantConfig.defaultWidth,
              height: variantConfig.defaultHeight,
            };

            // Marquer resizing: true pour protéger du sync Convex → ReactFlow
            updateNode(xyNode.id, {
              width: dimensions.width,
              height: dimensions.height,
              resizing: true,
            });

            // Envoyer la mutation, puis libérer le flag resizing
            await updatePositionOrDimensions({
              canvasId,
              nodeChanges: [{ id: xyNode.id, dimensions }],
            });

            updateNode(xyNode.id, { resizing: false });
          },
        }),
      ),
    },
    {
      label: "Duplicate",
      icon: TbCopyPlus,
      onClick: () => {
        const nodeToDuplicate = xyNode;
        if (nodeToDuplicate) {
          // Get the values from the existing nodeData to duplicate them
          let initialValues: Record<string, unknown> | undefined;
          const nodeDataId = nodeToDuplicate.data?.nodeDataId as
            | Id<"nodeDatas">
            | undefined;
          if (nodeDataId) {
            const nodeData = getNodeData(nodeDataId);
            if (nodeData) {
              initialValues = nodeData.values;
            }
          }

          createNode({
            node: nodeToDuplicate,
            position: {
              x: nodeToDuplicate.position.x + 50,
              y: nodeToDuplicate.position.y + 50,
            },
            initialValues,
          });
        }
      },
    },
    {
      label: "Move to another canvas",
      icon: TbArrowLeftFromArc,
      preventAutoClose: true,
      onClick: () => {
        setIsMoveModalOpen(true);
      },
    },
    {
      label: "Delete",
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
        Block actions
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
                      if (!sub.preventAutoClose) {
                        closeMenu();
                      }
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
              onClick={(e) => {
                if (option.preventAutoClose) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                option.onClick?.();
                if (!option.preventAutoClose) {
                  closeMenu();
                }
              }}
            >
              {option.icon({ size: 16 })} {option.label}
            </DropdownMenuItem>
          ),
        )}

      {createPortal(
        <MoveNodeToCanvasModal
          open={isMoveModalOpen}
          onOpenChange={setIsMoveModalOpen}
          nodeCanvasId={xyNode.id}
          onSuccess={() => {
            setIsMoveModalOpen(false);
            closeMenu();
          }}
        />,
        document.body,
      )}
    </>
  );
}
