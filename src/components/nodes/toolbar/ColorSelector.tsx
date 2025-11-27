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
import nodeColors from "../nodeColors";
import { memo, useCallback } from "react";

import { type Node, useReactFlow } from "@xyflow/react";
import prebuiltNodesConfig from "../prebuilt-nodes/prebuiltNodesConfig";

const ColorSelector = memo(function ColorSelector({
  xyNode,
}: {
  xyNode: Node;
}) {
  const { updateNodeData } = useReactFlow();
  const nodeConfig = prebuiltNodesConfig.find((n) => n.type === xyNode.type);

  // OPTIMISATION: useCallback empêche la recréation de la fonction à chaque render
  // - Stable la référence de la fonction passée en prop au DropdownMenu
  // - Évite les rerenders des enfants qui dépendent de cette fonction
  const handleColorChange = useCallback(
    (value: string) => {
      updateNodeData(xyNode.id, { color: value as NodeColors });
    },
    [xyNode.id, updateNodeData]
  );

  // Filtrer les couleurs disponibles selon la config du nœud
  const availableColors = Object.entries(nodeColors).filter(([key]) => {
    if (key === "transparent") {
      return nodeConfig?.canBeTransparent === true;
    }
    return true;
  });

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
            {availableColors.map(([key, value]) => (
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
