import { memo, useCallback } from "react";
import { useNode, useCanvasStore } from "../../../stores/canvasStore";
import { type Node, NodeToolbar } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import { BiParagraph } from "react-icons/bi";
import ColorSelector from "../toolbar/ColorSelector";
import InlineEditableText from "../../common/InlineEditableText";

function FloatingTextNode(xyNode: Node) {
  const canvasNode = useNode(xyNode.id);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);


  // OPTIMISATION: useCallback empêche la recréation des handlers à chaque render
  // - Stabilise les références des fonctions passées en props
  // - Évite les rerenders inutiles des composants enfants qui dépendent de ces fonctions
  const handleTextSave = useCallback(
    (newText: string) => {
      updateNodeData(xyNode.id, { text: newText });
    },
    [updateNodeData, xyNode.id]
  );

  const levels = [
    { value: "h1", icon: <LuHeading1 />, className: "text-2xl font-semibold" },
    { value: "h2", icon: <LuHeading2 />, className: "text-xl font-semibold" },
    { value: "h3", icon: <LuHeading3 />, className: "text-lg font-semibold" },
    { value: "p", icon: <BiParagraph />, className: "text-base font-normal" },
  ];
  const textClassName =
    levels.find((l) => l.value === (canvasNode?.data.level as string))
      ?.className || "";

  // OPTIMISATION: useCallback pour le changement de niveau de texte
  const handleLevelChange = useCallback(
    (value: string) => {
      updateNodeData(xyNode.id, { level: value });
    },
    [updateNodeData, xyNode.id]
  );

  if (!canvasNode) return null;

  return (
    <>
      <NodeToolbar
        isVisible={xyNode.selected && !xyNode.dragging}
        className="flex gap-2"
      >
        <ColorSelector canvasNode={canvasNode} />

        {/* Change heading */}
        <ToggleGroup
          type="single"
          variant="outline"
          className="bg-card"
          value={(canvasNode.data.level as string) || "h1"}
          onValueChange={handleLevelChange}
        >
          {levels.map((level) => (
            <ToggleGroupItem key={level.value} value={level.value}>
              {level.icon}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </NodeToolbar>

      <NodeFrame xyNode={xyNode} frameless>
        <InlineEditableText
          value={(canvasNode?.data?.text as string) || ""}
          onSave={handleTextSave}
          textClassName={textClassName}
          placeholder="Double-cliquez pour éditer..."
        />
      </NodeFrame>
    </>
  );
}

export default memo(FloatingTextNode);
