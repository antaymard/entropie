import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";

// Icons
import { BiSolidDuplicate } from "react-icons/bi";
import { HiOutlineTrash } from "react-icons/hi";

export default function NodeContextMenu({
  closeMenu,
  position,
  xyNode,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
  xyNode: Node;
}) {
  const { setNodes, addNodes, deleteElements } = useReactFlow();

  const nodeOptions = [
    {
      label: "Dupliquer",
      icon: BiSolidDuplicate,
      onClick: () => {
        const nodeToDuplicate = xyNode;
        if (nodeToDuplicate) {
          // Déselectionner le node original dans le state React Flow
          setNodes((nodes) =>
            nodes.map((n) =>
              n.id === xyNode.id ? { ...n, selected: false } : n
            )
          );

          // Ajouter le nouveau node dans le state Zustand (DB)
          addNodes({
            ...nodeToDuplicate,
            id: `node-${Date.now()}`,
            position: {
              x: nodeToDuplicate.position.x + 20,
              y: nodeToDuplicate.position.y + 20,
            },
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
