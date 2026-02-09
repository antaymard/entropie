import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/shadcn/dropdown-menu";
import { useReactFlow, type Edge } from "@xyflow/react";
import { HiOutlineTrash } from "react-icons/hi2";
import {
  TbPalette,
  TbLineHeight,
  TbArrowRight,
  TbCircle,
  TbTagOff,
  TbTrash,
} from "react-icons/tb";
import nodeColors from "@/components/nodes/nodeColors";
import type {
  EdgeCustomData,
  EdgeStrokeWidth,
  EdgeMarker,
  colorsEnum,
} from "@/types/domain";

export default function EdgeContextMenu({
  closeMenu,
  position,
  xyEdge,
}: {
  closeMenu: () => void;
  position: { x: number; y: number };
  xyEdge: Edge;
}) {
  const { deleteElements, updateEdge } = useReactFlow();

  const edgeData = (xyEdge.data || {}) as EdgeCustomData;

  const updateEdgeData = (newData: Partial<EdgeCustomData>) => {
    updateEdge(xyEdge.id, {
      ...xyEdge,
      data: { ...edgeData, ...newData },
    });
  };

  const handleRemoveLabel = () => {
    const { label, ...restData } = edgeData;
    updateEdge(xyEdge.id, {
      ...xyEdge,
      data: restData,
    });
    closeMenu();
  };

  const handleColorChange = (color: colorsEnum) => {
    updateEdgeData({ color });
  };

  const handleStrokeWidthChange = (strokeWidth: EdgeStrokeWidth) => {
    updateEdgeData({ strokeWidth });
  };

  const handleMarkerStartChange = (markerStart: EdgeMarker) => {
    updateEdgeData({ markerStart });
  };

  const handleMarkerEndChange = (markerEnd: EdgeMarker) => {
    updateEdgeData({ markerEnd });
  };

  const strokeWidthLabels = {
    thin: "Fin",
    regular: "Normal",
    thick: "Épais",
  };

  const markerLabels = {
    none: "Aucun",
    arrow: "Flèche",
  };

  // Filtrer les couleurs disponibles (sans transparent)
  const availableColors = Object.entries(nodeColors).filter(
    ([key]) => key !== "transparent",
  );

  return (
    <>
      <DropdownMenuLabel className="whitespace-nowrap">
        Actions sur le lien
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/* Supprimer le label */}
      {edgeData.label && (
        <>
          <DropdownMenuItem
            className="whitespace-nowrap"
            onClick={handleRemoveLabel}
          >
            <TbTagOff size={16} /> Supprimer le label
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}

      {/* Couleur */}
      {/* <DropdownMenuSub>
        <DropdownMenuSubTrigger className="whitespace-nowrap">
          <TbPalette size={16} /> Couleur
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={edgeData.color || "default"}
            onValueChange={(value) => handleColorChange(value as colorsEnum)}
          >
            {availableColors.map(([key, value]) => (
              <DropdownMenuRadioItem
                value={key}
                key={key}
                onClick={() => handleColorChange(key as colorsEnum)}
              >
                <div
                  className={`border ${value.border} ${value.bg} rounded-sm p-1 ${value.text}`}
                >
                  {value.label}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub> */}

      {/* Épaisseur */}
      {/* <DropdownMenuSub>
        <DropdownMenuSubTrigger className="whitespace-nowrap">
          <TbLineHeight size={16} /> Épaisseur
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={edgeData.strokeWidth || "regular"}
            onValueChange={(value) =>
              handleStrokeWidthChange(value as EdgeStrokeWidth)
            }
          >
            {Object.entries(strokeWidthLabels).map(([key, label]) => (
              <DropdownMenuRadioItem
                value={key}
                key={key}
                onClick={() => handleStrokeWidthChange(key as EdgeStrokeWidth)}
              >
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub> */}

      {/* Marker Début */}
      {/* <DropdownMenuSub>
        <DropdownMenuSubTrigger className="whitespace-nowrap">
          <TbCircle size={16} /> Début
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={edgeData.markerStart || "none"}
            onValueChange={(value) =>
              handleMarkerStartChange(value as EdgeMarker)
            }
          >
            {Object.entries(markerLabels).map(([key, label]) => (
              <DropdownMenuRadioItem
                value={key}
                key={key}
                onClick={() => handleMarkerStartChange(key as EdgeMarker)}
              >
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub> */}

      {/* Marker Fin */}
      {/* <DropdownMenuSub>
        <DropdownMenuSubTrigger className="whitespace-nowrap">
          <TbArrowRight size={16} /> Fin
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={edgeData.markerEnd || "none"}
            onValueChange={(value) => handleMarkerEndChange(value as EdgeMarker)}
          >
            {Object.entries(markerLabels).map(([key, label]) => (
              <DropdownMenuRadioItem
                value={key}
                key={key}
                onClick={() => handleMarkerEndChange(key as EdgeMarker)}
              >
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator /> */}

      {/* Supprimer */}
      <DropdownMenuItem
        className="whitespace-nowrap "
        onClick={() => {
          deleteElements({ edges: [xyEdge] });
          closeMenu();
        }}
      >
        <TbTrash className="text-red-500" /> Supprimer
      </DropdownMenuItem>
    </>
  );
}
