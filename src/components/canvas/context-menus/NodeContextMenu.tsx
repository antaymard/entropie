import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/shadcn/dropdown-menu";
import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";

// Icons
import { BiSolidDuplicate } from "react-icons/bi";
import { useCanvasStore, useNode } from "@/stores/canvasStore";


export default function NodeContextMenu({ closeMenu, position, xyNode }: { closeMenu: () => void; position: { x: number; y: number }; xyNode: Node }) {

  const addNode = useCanvasStore((state) => state.addNode);
  const canvasNode = useNode(xyNode.id);
  const { setNodes } = useReactFlow();

  const nodeOptions = [
    {
      label: "Dupliquer",
      icon: BiSolidDuplicate,
      onClick: () => {
        const nodeToDuplicate = canvasNode;
        if (nodeToDuplicate) {
          // Déselectionner le node original dans le state React Flow
          setNodes((nodes) =>
            nodes.map((n) =>
              n.id === xyNode.id ? { ...n, selected: false } : n
            )
          );

          // Ajouter le nouveau node dans le state Zustand (DB)
          addNode({
            ...nodeToDuplicate,
            id: `node-${Date.now()}`,
            position: {
              x: nodeToDuplicate.position.x + 20,
              y: nodeToDuplicate.position.y + 20,
            },
          });

          closeMenu();
        }
      }
    }
  ]
  // On est déjà dans DropdownMenuContent

  return (
    <>
      <DropdownMenuLabel className="whitespace-nowrap">Actions sur le bloc</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {nodeOptions.map((option, i) => (
        <DropdownMenuItem
          className="whitespace-nowrap"
          key={i}
          onClick={option.onClick}
        >
          {option.icon({ size: 16 })} {option.label}
        </DropdownMenuItem>
      ))}
    </>
  );
}




