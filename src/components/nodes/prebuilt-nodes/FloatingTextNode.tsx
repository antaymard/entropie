import { memo, useCallback } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import { BiParagraph } from "react-icons/bi";
import InlineEditableText from "../../form-ui/InlineEditableText";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";

function FloatingTextNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();

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
    levels.find((l) => l.value === (xyNode.data.level as string))?.className ||
    "";

  // OPTIMISATION: useCallback pour le changement de niveau de texte
  const handleLevelChange = useCallback(
    (value: string) => {
      updateNodeData(xyNode.id, { level: value });
    },
    [updateNodeData, xyNode.id]
  );

  if (!xyNode) return null;

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        {/* Change heading */}
        <ToggleGroup
          type="single"
          variant="outline"
          className="bg-card"
          value={(xyNode.data.level as string) || "h1"}
          onValueChange={handleLevelChange}
        >
          {levels.map((level) => (
            <ToggleGroupItem key={level.value} value={level.value}>
              {level.icon}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CanvasNodeToolbar>

      <NodeFrame xyNode={xyNode} headerless>
        <InlineEditableText
          multiline
          value={(xyNode.data?.text as string) || ""}
          onSave={handleTextSave}
          className={textClassName}
          placeholder="Double-cliquez pour éditer..."
        />
      </NodeFrame>
    </>
  );
}

export default memo(FloatingTextNode);
