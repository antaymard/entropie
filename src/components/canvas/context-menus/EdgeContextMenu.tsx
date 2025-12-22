import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import { useReactFlow, type Edge } from "@xyflow/react";
import { HiOutlineTrash } from "react-icons/hi2";

export default function EdgeContextMenu({
  closeMenu,
  position,
  xyEdge,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
  xyEdge: Edge;
}) {
  const { deleteElements } = useReactFlow();

  const edgeOptions = [
    {
      label: "Supprimer",
      icon: HiOutlineTrash,
      onClick: () => {
        deleteElements({ edges: [xyEdge] });
      },
    },
  ];

  return (
    <>
      <DropdownMenuLabel className="whitespace-nowrap">
        Actions sur le lien
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {edgeOptions.map((option, i) => (
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
