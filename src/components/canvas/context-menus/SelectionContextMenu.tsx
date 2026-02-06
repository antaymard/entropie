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
import {
  TbKeyframeAlignCenter,
  TbArrowAutofitWidth,
  TbArrowAutofitHeight,
} from "react-icons/tb";
import { MdOutlineFitScreen } from "react-icons/md";

export default function SelectionContextMenu({
  closeMenu,
  elements,
}: {
  closeMenu: () => void;
  elements: Node[] | object | null;
}) {
  const { deleteElements, updateNode } = useReactFlow();

  async function alignSelectedNodes(
    alignment: "left" | "right" | "top" | "bottom",
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
          }),
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
          }),
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

  async function uniformizeSelectedNodes(axis: "width" | "height") {
    // Récupère la plus grande largeur ou hauteur et la donne à tous les noeuds
    if (!Array.isArray(elements)) return;

    let targetValue: number;
    switch (axis) {
      case "width":
        targetValue = Math.max(
          ...elements.map((node) => node.measured?.width || node.width || 0),
        );
        break;
      case "height":
        targetValue = Math.max(
          ...elements.map((node) => node.measured?.height || node.height || 0),
        );
        break;
    }
    elements.forEach((node) => {
      updateNode(
        node.id,
        axis === "width" ? { width: targetValue } : { height: targetValue },
      );
    });
  }

  const alignements = [
    {
      label: "En haut",
      icon: RiAlignItemTopLine,
      onClick: () => alignSelectedNodes("top"),
    },
    {
      label: "A droite",
      icon: RiAlignItemRightLine,
      onClick: () => alignSelectedNodes("right"),
    },
    {
      label: "En bas",
      icon: RiAlignItemBottomLine,
      onClick: () => alignSelectedNodes("bottom"),
    },
    {
      label: "A gauche",
      icon: RiAlignItemLeftLine,
      onClick: () => alignSelectedNodes("left"),
    },
  ];

  const uniformizations = [
    {
      label: "Même largeur",
      icon: TbArrowAutofitWidth,
      onClick: () => uniformizeSelectedNodes("width"),
    },
    {
      label: "Même hauteur",
      icon: TbArrowAutofitHeight,
      onClick: () => uniformizeSelectedNodes("height"),
    },
  ];

  return (
    <>
      <DropdownMenuLabel className="whitespace-nowrap">
        Actions sur la sélection
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/* Alignement
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

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <MdOutlineFitScreen /> Uniformiser
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {uniformizations.map(({ label, icon: Icon, onClick }, i) => (
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
      </DropdownMenuSub> */}

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
