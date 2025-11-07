import { useMutation, useQuery } from "convex/react";
import {
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupAction,
  SidebarMenuAction,
  SidebarTrigger,
} from "../shadcn/sidebar";
import CanvasCreationModal from "./CanvasCreationModal";
import { useState } from "react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { HiMiniPlus, HiMiniEllipsisVertical } from "react-icons/hi2";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../shadcn/dropdown-menu";
import { toastError } from "../utils/errorUtils";
import toast from "react-hot-toast";

export default function CanvasSidebar({
  currentCanvasId,
}: {
  currentCanvasId: Id<"canvases">;
}) {
  const [isCanvasCreationModalOpen, setIsCanvasCreationModalOpen] =
    useState(false);
  const userCanvases = useQuery(api.canvases.getUserCanvases);
  const deleteCanvas = useMutation(api.canvases.deleteCanvas);
  const { setOpen } = useSidebar();

  async function handleDeleteCanvas(canvasId: Id<"canvases">) {
    try {
      await deleteCanvas({ canvasId });
      toast.success("Espace supprimé");
    } catch (error) {
      toastError(error, "Erreur lors de la suppression de l'espace.");
    }
  }

  return (
    <>
      <Sidebar variant="sidebar" collapsible="offcanvas" className="shadow-md">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Entropie</h1>
            <SidebarTrigger />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Espaces</SidebarGroupLabel>
            <SidebarGroupAction
              title="Créer un nouvel espace"
              onClick={() => setIsCanvasCreationModalOpen(true)}
            >
              <HiMiniPlus />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {userCanvases ? (
                  userCanvases.map((canvas) => (
                    <SidebarMenuItem key={canvas._id} className="group/item">
                      <SidebarMenuButton
                        asChild
                        isActive={canvas._id === currentCanvasId}
                      >
                        <Link
                          key={canvas._id}
                          to={`/canvas/${canvas._id}`}
                          onClick={() => setOpen(false)}
                        >
                          {canvas.name}
                          {canvas._id === currentCanvasId && (
                            <span className="text-xs ml-2 italic">Actuel</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                      <DropdownMenu >
                        <DropdownMenuTrigger asChild className="group-hover/item:opacity-100 opacity-0 transition-opacity">
                          <SidebarMenuAction><HiMiniEllipsisVertical /></SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            onClick={() => handleDeleteCanvas(canvas._id)}
                          >
                            Supprimer l'espace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>Aucun espace disponible</SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>Footer</SidebarFooter>
      </Sidebar>
      {/* <div className="flex flex-row justify-between items-center">
        <h2 className="text-lg font-semibold">Espaces</h2>
        <button
          className="rounded-md text-sm bg-gray-100 p-1 px-2 hover:bg-gray-200"
          onClick={() => setIsCanvasCreationModalOpen(true)}
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
      )} */}
      <CanvasCreationModal
        isModalOpen={isCanvasCreationModalOpen}
        setIsModalOpen={setIsCanvasCreationModalOpen}
      />
    </>
  );
}
