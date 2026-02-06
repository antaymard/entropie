import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import { useCreateNode } from "@/hooks/useCreateNode";
import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";

// Icons
import { BiSolidDuplicate } from "react-icons/bi";
import { HiOutlineTrash } from "react-icons/hi";
import { TbCopyPlus, TbCopyPlusFilled } from "react-icons/tb";

export default function NodeContextMenu({
  closeMenu,
  position,
  xyNode,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
  xyNode: Node;
}) {
  const { deleteElements } = useReactFlow();
  const { createNode } = useCreateNode();

  const nodeOptions = [
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
      {nodeOptions.map((option, i) => (
        <DropdownMenuItem
          className="whitespace-nowrap"
          key={i}
          onClick={() => {
            option.onClick();
            closeMenu();
          }}
        >
          {option.icon({ size: 16 })} {option.label}
        </DropdownMenuItem>
      ))}
    </>
  );
}
