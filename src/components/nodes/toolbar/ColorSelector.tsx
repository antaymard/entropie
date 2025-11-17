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
import { memo, useCallback } from "react";

// OPTIMISATION: memo() empêche le rerender du ColorSelector quand d'autres nodes changent
// - Sans memo: rerender à chaque changement de n'importe quel node sur le canvas
// - Avec memo: rerender uniquement si canvasNode change (référence ou propriétés)
const ColorSelector = memo(function ColorSelector({
  canvasNode,
}: {
  canvasNode: CanvasNode;
}) {
  const updateNode = useCanvasStore((state) => state.updateNode);

  // OPTIMISATION: useCallback empêche la recréation de la fonction à chaque render
  // - Stable la référence de la fonction passée en prop au DropdownMenu
  // - Évite les rerenders des enfants qui dépendent de cette fonction
  const handleColorChange = useCallback(
    (value: string) => {
      updateNode(canvasNode.id, { color: value as NodeColors });
    },
    [canvasNode.id, updateNode]
  );

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
            onValueChange={handleColorChange}
          >
            {Object.entries(colors).map(([key, value]) => (
              <DropdownMenuRadioItem
                value={key}
                key={key}
                onClick={() => handleColorChange(key)}
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
});

export default ColorSelector;
