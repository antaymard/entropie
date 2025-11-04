import { useMutation } from "convex/react";
import { useState, useRef, useEffect } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useCanvasStore } from "../../stores/canvasStore";
import { toDbNode } from "../utils/nodeUtils";
import toast from "react-hot-toast";
import { toastError } from "../utils/errorUtils";

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

  const updateCanvasDetails = useMutation(api.canvases.updateCanvasDetails);
  const updateCanvasContent = useMutation(api.canvases.updateCanvasContent);

  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);

  const handleUpdateCanvasContent = async () => {
    try {
      const nodesToSave = nodes.map(toDbNode);
      await updateCanvasContent({
        canvasId: canvasId as Id<"canvases">,
        nodes: nodesToSave,
        edges,
      });
      toast.success("Sauvegardé", { position: "top-right" });
    } catch (error) {
      toastError(error, "Erreur lors de la sauvegarde du canvas.");
    }
  };

  const handleUpdateCanvasDetails = async (newName: string) => {
    await updateCanvasDetails({
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
      handleUpdateCanvasDetails(editValue.trim());
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
          className="font-semibold cursor-pointer hover:text-black text-lg"
          onDoubleClick={handleDoubleClick}
        >
          {canvasName || "Sans nom"}
        </h1>
      )}
      <div>
        <button
          type="button"
          className="rounded-sm bg-green-500 text-white px-3 py-1 hover:bg-green-600 font-semibold"
          onClick={handleUpdateCanvasContent}
        >
          Sauvegarder
        </button>
      </div>
    </div>
  );
}
