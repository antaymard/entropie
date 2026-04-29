import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import { useReactFlow, type Edge } from "@xyflow/react";
import { TbTagOff, TbTrash } from "react-icons/tb";
import type { EdgeCustomData } from "@/types/domain";
import { useUpdateCanvasEdge } from "@/hooks/useUpdateCanvasEdge";

export default function EdgeContextMenu({
  closeMenu,
  xyEdge,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
  xyEdge: Edge;
}) {
  const { deleteElements } = useReactFlow();
  const { updateCanvasEdge } = useUpdateCanvasEdge();

  const edgeData = (xyEdge.data || {}) as EdgeCustomData;
  const hasLabel = Boolean(edgeData.label);

  const handleRemoveLabel = () => {
    const nextData: Record<string, unknown> = { ...edgeData };
    delete nextData.label;
    void updateCanvasEdge({ edgeId: xyEdge.id, data: nextData });
    closeMenu();
  };

  return (
    <>
      <DropdownMenuLabel className="whitespace-nowrap">
        Edge actions
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {hasLabel && (
        <DropdownMenuItem
          className="whitespace-nowrap"
          onClick={handleRemoveLabel}
        >
          <TbTagOff size={16} /> Remove label
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        className="whitespace-nowrap"
        onClick={() => {
          deleteElements({ edges: [xyEdge] });
          closeMenu();
        }}
      >
        <TbTrash className="text-red-500" /> Delete
      </DropdownMenuItem>
    </>
  );
}
