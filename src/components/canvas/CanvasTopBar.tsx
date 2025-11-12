import { useMutation } from "convex/react";
import { useState, useRef, useEffect } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useCanvasStore } from "../../stores/canvasStore";
import { toCanvasNodes } from "../utils/nodeUtils";
import toast from "react-hot-toast";
import { toastError } from "../utils/errorUtils";
import { Link } from "@tanstack/react-router";
import { HiOutlineCog } from "react-icons/hi";
import { TbLayoutSidebarLeftExpand } from "react-icons/tb";
import { Button } from "../shadcn/button";
import { useSidebar } from "../shadcn/sidebar";
import { useReactFlow } from '@xyflow/react';

export default function CanvasTopBar() {
  const canvas = useCanvasStore((state) => state.canvas);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(canvas?.name || "Sans nom");
  const inputRef = useRef<HTMLInputElement>(null);
  const { setOpen } = useSidebar();

  const updateCanvasDetails = useMutation(api.canvases.updateCanvasDetails);
  const updateCanvasContent = useMutation(api.canvases.updateCanvasContent);


  // Récuperer les nodes de reactflow provider
  const { getNodes, getEdges } = useReactFlow();


  const handleUpdateCanvasContent = async () => {
    try {
      const _nodes = getNodes();
      const _edges = getEdges();
      const nodesInConvexFormat = toCanvasNodes(_nodes);

      await updateCanvasContent({
        canvasId: canvas?._id as Id<"canvases">,
        nodes: nodesInConvexFormat,
        edges: _edges,
      });
      toast.success("Sauvegardé", { position: "top-right" });
    } catch (error) {
      toastError(error, "Erreur lors de la sauvegarde du canvas.");
    }
  };

  const handleUpdateCanvasDetails = async (newName: string) => {
    await updateCanvasDetails({
      canvasId: canvas?._id as Id<"canvases">,
      name: newName,
    });
  };

  useEffect(() => {
    setEditValue(canvas?.name || "Sans nom");
  }, [canvas?.name]);

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
    if (editValue.trim() && editValue !== canvas?.name) {
      handleUpdateCanvasDetails(editValue.trim());
    } else {
      setEditValue(canvas?.name || "Sans nom");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setEditValue(canvas?.name || "Sans nom");
      setIsEditing(false);
    }
  };

  return (
    <>
      <div className="h-15 flex items-center justify-between px-4 border-b border-gray-300 bg-white ">
        <div className="rounded-sm border border-gray-300 flex divide-x divide-gray-300">
          <button
            className="hover:bg-gray-200 p-2 flex items-center rounded-xs"
            title="Espaces"
            type="button"
            onClick={() => setOpen(true)}
          >
            <TbLayoutSidebarLeftExpand size={18} />
          </button>
          <Link
            to="/settings"
            className="hover:bg-gray-200 p-2 flex items-center rounded-xs"
            title="Paramètres"
          >
            <HiOutlineCog size={18} />
          </Link>
        </div>
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
            {canvas?.name || "Sans nom"}
          </h1>
        )}
        <div>
          <Button
            type="button"
            onClick={handleUpdateCanvasContent}
            className="hover:bg-green-900"
          >
            Sauvegarder
          </Button>
        </div>
      </div>
    </>
  );
}
