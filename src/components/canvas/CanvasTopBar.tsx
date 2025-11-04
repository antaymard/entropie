import { useMutation } from "convex/react";
import { useState, useRef, useEffect } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

export default function CanvasTopBar({
  canvasId,
  canvasName,
}: {
  canvasId: Id<"canvases">;
  canvasName?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(canvasName || "Sans nom");
  const inputRef = useRef<HTMLInputElement>(null);

  const updateCanvas = useMutation(api.canvases.updateCanvas);

  const handleUpdateCanvas = async (newName: string) => {
    await updateCanvas({
      canvasId: canvasId as Id<"canvases">,
      name: newName,
    });
  };

  useEffect(() => {
    setEditValue(canvasName || "Sans nom");
  }, [canvasName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== canvasName) {
      handleUpdateCanvas(editValue.trim());
    } else {
      setEditValue(canvasName || "Sans nom");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setEditValue(canvasName || "Sans nom");
      setIsEditing(false);
    }
  };

  return (
    <div className="h-15 flex items-center justify-between px-4 border-b border-gray-300 bg-white ">
      <div></div>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="font-semibold text-center bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500"
        />
      ) : (
        <h1
          className="font-semibold cursor-pointer hover:text-gray-600"
          onDoubleClick={handleDoubleClick}
        >
          {canvasName || "Sans nom"}
        </h1>
      )}
      <div></div>
    </div>
  );
}
