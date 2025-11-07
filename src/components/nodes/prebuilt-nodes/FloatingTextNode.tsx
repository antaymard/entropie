import { memo, useState, useRef, useEffect } from "react";
import { useNode, useCanvasStore } from "../../../stores/canvasStore";
import { type Node, NodeToolbar } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import type { NodeColors } from "@/types/node.types";
import { ButtonGroup } from "@/components/shadcn/button-group";
import { Button } from "@/components/shadcn/button";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { HiMiniXMark, HiMiniCheck } from "react-icons/hi2";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import { BiParagraph } from "react-icons/bi";

function FloatingTextNode(xyNode: Node) {
  const canvasNode = useNode(xyNode.id);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const updateNode = useCanvasStore((state) => state.updateNode);
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

  const handleStartEdit = () => {
    setEditValue(currentText);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue !== currentText) {
      updateNodeData(xyNode.id, { text: editValue });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };


  const levels = [
    { value: "h1", icon: <LuHeading1 />, className: "text-2xl font-semibold" },
    { value: "h2", icon: <LuHeading2 />, className: "text-xl font-semibold" },
    { value: "h3", icon: <LuHeading3 />, className: "text-lg font-semibold" },
    { value: "p", icon: <BiParagraph />, className: "text-base font-normal" },
  ]
  const textClassName = levels.find(l => l.value === (canvasNode.data.level as string))?.className || '';


  return (
    <>
      <NodeToolbar isVisible={xyNode.selected} className="flex gap-2" >
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
        <ToggleGroup type="single" variant="outline" className="bg-card" value={canvasNode.color} onValueChange={(value) => {
          updateNode(xyNode.id, { color: value as NodeColors });
        }}>
          <ToggleGroupItem value="default">1</ToggleGroupItem>
          <ToggleGroupItem value="yellow">2</ToggleGroupItem>
          <ToggleGroupItem value="blue">3</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="single"
          variant="outline"
          className="bg-card"
          value={canvasNode.data.level as string || "h1"}
          onValueChange={(value) => {
            updateNodeData(xyNode.id, { level: value as string });
          }}>
          <ToggleGroupItem value="h1"><LuHeading1 /></ToggleGroupItem>
          <ToggleGroupItem value="h2"><LuHeading2 /></ToggleGroupItem>
          <ToggleGroupItem value="h3"><LuHeading3 /></ToggleGroupItem>
          <ToggleGroupItem value="p"><BiParagraph /></ToggleGroupItem>
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
          >
            {currentText}
          </div>
        )}
      </NodeFrame>
    </>
  );
}

export default memo(FloatingTextNode);
