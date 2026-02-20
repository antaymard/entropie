import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ButtonGroup } from "@/components/shadcn/button-group";
import { Button } from "@/components/shadcn/button";
import { TbPalette, TbCheck } from "react-icons/tb";
import { memo, useCallback } from "react";
import { type Node } from "@xyflow/react";
import prebuiltNodesConfig from "../prebuilt-nodes/prebuiltNodesConfig";
import { useUpdateCanvasNode } from "@/hooks/useUpdateCanvasNode";
import type { colorsEnum } from "@/types/domain";
import { colors } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

const ColorSelector = memo(function ColorSelector({
  xyNode,
}: {
  xyNode: Node;
}) {
  const { updateCanvasNode } = useUpdateCanvasNode();
  const nodeConfig = prebuiltNodesConfig.find(
    (n) => n.node.type === xyNode.type,
  );

  const handleColorChange = useCallback(
    (value: string) => {
      updateCanvasNode({
        nodeId: xyNode.id,
        props: { color: value as colorsEnum },
      });
    },
    [xyNode.id, updateCanvasNode],
  );

  // Filtrer les couleurs disponibles selon la config du nœud
  const availableColors = Object.entries(colors).filter(([key]) => {
    if (key === "transparent") {
      return nodeConfig?.canBeTransparent === true;
    }
    return true;
  });

  const currentColor = (xyNode.data.color as colorsEnum) || "default";

  return (
    <ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <TbPalette />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel>Block color</DropdownMenuLabel>
          <div className="grid grid-cols-5 gap-2 p-2">
            {availableColors.map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleColorChange(key as colorsEnum)}
                className={cn(
                  "relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
                  value.nodeBg,
                  currentColor === key
                    ? "border-primary shadow-md"
                    : "border-border hover:border-primary/50",
                )}
                title={value.label}
              >
                {currentColor === key && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TbCheck
                      className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                      strokeWidth={3}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
});

export default ColorSelector;
