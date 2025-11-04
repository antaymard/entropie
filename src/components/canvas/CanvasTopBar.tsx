import { useMutation, useQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useCanvasStore } from "../../stores/canvasStore";
import { toDbNode } from "../utils/nodeUtils";
import toast from "react-hot-toast";
import { toastError } from "../utils/errorUtils";
import { Link } from "@tanstack/react-router";
import { HiOutlineCog } from "react-icons/hi";
import { TbLayoutSidebarLeftExpand } from "react-icons/tb";
import CanvasCreationModal from "./CanvasCreationModal";

export default function CanvasTopBar({
  canvasId,
  canvasName,
}: {
  canvasId: Id<"canvases">;
  canvasName?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(canvasName || "Sans nom");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    <>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        close={() => setIsSidebarOpen(false)}
        currentCanvasId={canvasId}
      />
      <div className="h-15 flex items-center justify-between px-4 border-b border-gray-300 bg-white ">
        <div className="rounded-sm border border-gray-300 flex divide-x divide-gray-300">
          <button
            className="hover:bg-gray-200 p-2 flex items-center rounded-xs"
            title="Espaces"
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
    </>
  );
}

function Sidebar({
  isSidebarOpen,
  close,
  currentCanvasId,
}: {
  isSidebarOpen: boolean;
  close: () => void;
  currentCanvasId: Id<"canvases">;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userCanvases = useQuery(api.canvases.getUserCanvases);

  return (
    <>
      <div
        className="fixed left-0 bottom-0 top-0 w-72 z-50 bg-white/50 border-r border-gray-300 shadow-xl backdrop-blur-sm p-4 space-y-4"
        onMouseLeave={close}
        style={{
          transform: isSidebarOpen ? "translateX(0%)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <div className="flex flex-row justify-between items-center">
          <h2 className="text-lg font-semibold">Espaces</h2>
          <button
            className="rounded-md text-sm bg-gray-100 p-1 px-2 hover:bg-gray-200"
            onClick={() => setIsModalOpen(true)}
          >
            + Nouvel Espace
          </button>
        </div>
        {userCanvases ? (
          <>
            <div className="flex flex-col gap-2">
              {userCanvases.map((canvas, i) => (
                <Link
                  to={`/canvas/${canvas._id}`}
                  key={i}
                  className={`rounded-sm p-2  ${
                    canvas._id === currentCanvasId
                      ? "font-bold bg-blue-200 text-blue-500"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {canvas.name}
                  {canvas._id === currentCanvasId && (
                    <span className="text-xs ml-2 italic">Actuel</span>
                  )}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p>Vous n'avez pas de canvases.</p>
        )}
      </div>
      <CanvasCreationModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </>
  );
}
