import { memo, useState, useRef, useEffect, useCallback } from "react";
import { useNode, useCanvasStore } from "../../../stores/canvasStore";
import { type Node, NodeToolbar } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { ButtonGroup } from "@/components/shadcn/button-group";
import { Button } from "@/components/shadcn/button";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { HiMiniXMark, HiMiniCheck } from "react-icons/hi2";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import { BiParagraph } from "react-icons/bi";

import ColorSelector from "../toolbar/ColorSelector";

function FloatingTextNode(xyNode: Node) {
  const canvasNode = useNode(xyNode.id);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const currentText = (canvasNode?.data?.text as string) || "";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!canvasNode) return null;

  // OPTIMISATION: useCallback empêche la recréation des handlers à chaque render
  // - Stabilise les références des fonctions passées en props
  // - Évite les rerenders inutiles des composants enfants qui dépendent de ces fonctions
  const handleStartEdit = useCallback(() => {
    setEditValue(currentText);
    setIsEditing(true);
  }, [currentText]);

  const handleSave = useCallback(() => {
    if (editValue !== currentText) {
      updateNodeData(xyNode.id, { text: editValue });
    }
    setIsEditing(false);
  }, [editValue, currentText, updateNodeData, xyNode.id]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const levels = [
    { value: "h1", icon: <LuHeading1 />, className: "text-2xl font-semibold" },
    { value: "h2", icon: <LuHeading2 />, className: "text-xl font-semibold" },
    { value: "h3", icon: <LuHeading3 />, className: "text-lg font-semibold" },
    { value: "p", icon: <BiParagraph />, className: "text-base font-normal" },
  ];
  const textClassName =
    levels.find((l) => l.value === (canvasNode.data.level as string))
      ?.className || "";

  // OPTIMISATION: useCallback pour le changement de niveau de texte
  const handleLevelChange = useCallback(
    (value: string) => {
      updateNodeData(xyNode.id, { level: value });
    },
    [updateNodeData, xyNode.id]
  );

  return (
    <>
      <NodeToolbar
        isVisible={xyNode.selected && !xyNode.dragging}
        className="flex gap-2"
      >
        <ButtonGroup className="bg-card">
          {isEditing && (
            <>
              <Button variant="outline" onClick={handleSave}>
                <HiMiniCheck />
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <HiMiniXMark />
              </Button>
            </>
          )}
          {!isEditing && (
            <Button variant="outline" onClick={handleStartEdit}>
              <MdOutlineModeEditOutline />
            </Button>
          )}
        </ButtonGroup>

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
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={`w-full bg-transparent border-none outline-none ${textClassName}`}
            style={{
              font: "inherit",
              padding: 0,
              margin: 0,
            }}
          />
        ) : (
          <div
            ref={textRef}
            className={textClassName}
            onDoubleClick={handleStartEdit}
          >
            {currentText}
          </div>
        )}
      </NodeFrame>
    </>
  );
}

export default memo(FloatingTextNode);
