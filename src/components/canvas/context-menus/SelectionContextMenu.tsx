import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/shadcn/dropdown-menu";
import { useReactFlow, type Node } from "@xyflow/react";

import {
  RiAlignItemLeftLine,
  RiAlignItemRightLine,
  RiAlignItemTopLine,
  RiAlignItemBottomLine,
} from "react-icons/ri";
import { HiOutlineTrash } from "react-icons/hi";
import { TbKeyframeAlignCenter } from "react-icons/tb";

export default function SelectionContextMenu({
  closeMenu,
  elements,
}: {
  closeMenu: () => void;
  elements: Node[] | object | null;
}) {
  const { deleteElements, updateNode } = useReactFlow();

  // Doc pour updateNode (id: string, dataUpdate: Partial<Record<string, unknown>> | ((node: Node) => Partial<Record<string, unknown>>), options?: { replace: boolean; } | undefined) => void
  async function alignSelectedNodes(
    alignment: "left" | "right" | "top" | "bottom"
  ) {
    if (!Array.isArray(elements)) return;

    let targetValue: number;

    switch (alignment) {
      case "left":
        // Trouve le x le plus petit (le plus à gauche)
        targetValue = Math.min(...elements.map((node) => node.position.x));
        elements.forEach((node) => {
          updateNode(node.id, {
            position: { ...node.position, x: targetValue },
          });
        });
        break;

      case "bottom":
        // Trouve le y + hauteur le plus grand (le plus en bas)
        targetValue = Math.max(
          ...elements.map((node) => {
            const height = node.measured?.height || node.height || 0;
            return node.position.y + height;
          })
        );
        elements.forEach((node) => {
          const height = node.measured?.height || node.height || 0;
          updateNode(node.id, {
            position: { ...node.position, y: targetValue - height },
          });
        });
        break;

      case "right":
        // Trouve le x + largeur le plus grand (le plus à droite)
        targetValue = Math.max(
          ...elements.map((node) => {
            const width = node.measured?.width || node.width || 0;
            return node.position.x + width;
          })
        );
        elements.forEach((node) => {
          const width = node.measured?.width || node.width || 0;
          updateNode(node.id, {
            position: { ...node.position, x: targetValue - width },
          });
        });
        break;

      case "top":
        // Trouve le y le plus petit (le plus en haut)
        targetValue = Math.min(...elements.map((node) => node.position.y));
        elements.forEach((node) => {
          updateNode(node.id, {
            position: { ...node.position, y: targetValue },
          });
        });
        break;
    }
  }

  const alignements = [
    {
      label: "A gauche",
      icon: RiAlignItemLeftLine,
      onClick: () => alignSelectedNodes("left"),
    },
    {
      label: "A droite",
      icon: RiAlignItemRightLine,
      onClick: () => alignSelectedNodes("right"),
    },
    {
      label: "En haut",
      icon: RiAlignItemTopLine,
      onClick: () => alignSelectedNodes("top"),
    },
    {
      label: "En bas",
      icon: RiAlignItemBottomLine,
      onClick: () => alignSelectedNodes("bottom"),
    },
  ];

  return (
    <>
      <DropdownMenuLabel className="whitespace-nowrap">
        Actions sur la sélection
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/* Alignement */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <TbKeyframeAlignCenter /> Aligner
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {alignements.map(({ label, icon: Icon, onClick }, i) => (
              <DropdownMenuItem
                key={i}
                onClick={() => {
                  onClick();
                  closeMenu();
                }}
              >
                <Icon className="mr-2" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      {/* Suppression */}
      <DropdownMenuItem
        onClick={() => {
          deleteElements({ nodes: elements as Node[] });
          closeMenu();
        }}
      >
        <HiOutlineTrash />
        Supprimer
      </DropdownMenuItem>
    </>
  );
}
