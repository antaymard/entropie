import { memo, useState, useRef, useEffect } from "react";
import { useNode, useCanvasStore } from "../../../stores/canvasStore";
import { type Node } from "@xyflow/react";
import NodeFrame from "../NodeFrame";

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

  const handleDoubleClick = () => {
    setEditValue(currentText);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue !== currentText) {
      updateNodeData(xyNode.id, { text: editValue });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <NodeFrame xyNode={xyNode}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full bg-transparent border-none outline-none"
          style={{
            font: "inherit",
            padding: 0,
            margin: 0,
          }}
        />
      ) : (
        <div
          ref={textRef}
          onDoubleClick={handleDoubleClick}
          className="cursor-text"
        >
          {currentText}
        </div>
      )}
    </NodeFrame>
  );
}

export default memo(FloatingTextNode);
