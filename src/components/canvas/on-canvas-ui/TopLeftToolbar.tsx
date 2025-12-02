import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { useCanvasStore } from "@/stores/canvasStore";
import { api } from "@/../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { HiMiniChevronDown } from "react-icons/hi2";
import InlineEditableText from "@/components/form-ui/InlineEditableText";
import { LuUndo, LuRedo } from "react-icons/lu";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogTrigger } from "@/components/shadcn/dialog";
import CanvasCreationModal from "../CanvasCreationModal";

export default function TopLeftToolbar({
  undo,
  redo,
}: {
  undo: () => void;
  redo: () => void;
}) {
  const canvas = useCanvasStore((state) => state.canvas);
  const updateCanvasDetails = useMutation(api.canvases.updateCanvasDetails);
  const deleteCanvas = useMutation(api.canvases.deleteCanvas);

  const { canvases: userCanvases } =
    useQuery(api.canvases.getUserCanvases) ||
    ({} as {
      canvases: Array<{ _id: Id<"canvases">; name: string }>;
    });

  if (userCanvases === undefined) {
    return null;
  }

  const handleUpdateCanvasDetails = async (newName: string) => {
    await updateCanvasDetails({
      canvasId: canvas?._id as Id<"canvases">,
      name: newName,
    });
  };

  function renderUserCanvases() {
    return userCanvases.map((c) => (
      <DropdownMenuItem key={c._id} asChild>
        <Link key={c._id} to="/canvas/$canvasId" params={{ canvasId: c._id }}>
          {c.name}
          {c._id === canvas?._id && (
            <span className="text-xs ml-2 italic">Actuel</span>
          )}
        </Link>
      </DropdownMenuItem>
    ));
  }

  return (
    <div className="h-12 flex items-center gap-2">
      <div className="bg-white p-2 rounded h-full border border-gray-300 flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1">
              <img src="/favicon.svg" alt="Logo de Nolenor" className="h-5" />
              <HiMiniChevronDown size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="flex items-center justify-between">
              Vos espaces
              <Dialog>
                <DialogTrigger>
                  <AiOutlinePlusCircle size={14} />
                </DialogTrigger>
                <CanvasCreationModal />
              </Dialog>
            </DropdownMenuLabel>
            {renderUserCanvases()}
          </DropdownMenuContent>
        </DropdownMenu>
        <InlineEditableText
          value={canvas?.name || "Sans nom"}
          onSave={handleUpdateCanvasDetails}
          as="h1"
          className="font-semibold hover:bg-accent p-1 px-2 rounded-sm"
          placeholder="Sans nom"
        />
      </div>

      <div className="bg-white p-2 rounded h-full border border-gray-300 flex items-center">
        <Button variant="ghost" onClick={undo}>
          <LuUndo />
        </Button>
        <Button variant="ghost" onClick={redo}>
          <LuRedo />
        </Button>
      </div>
    </div>
  );
}
