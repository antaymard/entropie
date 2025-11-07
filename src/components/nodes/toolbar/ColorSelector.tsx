import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ButtonGroup } from "@/components/shadcn/button-group";
import { Button } from "@/components/shadcn/button";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasNode, NodeColors } from "@/types";
import { TbPalette } from "react-icons/tb";
import { colors } from "../nodeConfigs";

export default function ColorSelector({
  canvasNode,
}: {
  canvasNode: CanvasNode;
}) {
  const updateNode = useCanvasStore((state) => state.updateNode);

  return (
    <ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <TbPalette />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Couleur du bloc</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={canvasNode.color}
            onValueChange={(value) => {
              updateNode(canvasNode.id, { color: value as NodeColors });
            }}
          >
            {Object.entries(colors).map(([key, value]) => (
              <DropdownMenuRadioItem
                value={key}
                key={key}
                onClick={() => {
                  updateNode(canvasNode.id, { color: key as NodeColors });
                }}
              >
                <div
                  className={`border ${value.border} ${value.bg} rounded-sm p-1 ${value.text} `}
                >
                  {value.label}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
