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
import type { NodeColors } from "@/types";
import { TbPalette } from "react-icons/tb";
import { colors } from "../nodeConfigs";
import { memo, useCallback } from "react";

import { type Node, useReactFlow } from '@xyflow/react';

const ColorSelector = memo(function ColorSelector({
  xyNode,
}: {
  xyNode: Node;
}) {
  const { updateNode } = useReactFlow();

  // OPTIMISATION: useCallback empêche la recréation de la fonction à chaque render
  // - Stable la référence de la fonction passée en prop au DropdownMenu
  // - Évite les rerenders des enfants qui dépendent de cette fonction
  const handleColorChange = useCallback(
    (value: string) => {
      updateNode(xyNode.id, { data: { ...xyNode.data, color: value as NodeColors } });
    },
    [xyNode.id, updateNode]
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
            value={xyNode.data.color || "default"}
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
