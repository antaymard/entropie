import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/shadcn/sidebar";
import { Button } from "@/components/shadcn/button";
import { api } from "@/../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogTrigger } from "@/components/shadcn/dialog";
import CanvasCreationModal from "./CanvasCreationModal";
import { useCanvasStore } from "@/stores/canvasStore";
import { useShallow } from "zustand/shallow";
import { AiOutlinePlusCircle } from "react-icons/ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { HiDotsVertical } from "react-icons/hi";

export default function CanvasSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const canvas = useCanvasStore(useShallow((state) => state.canvas));
  const deleteCanvas = useMutation(api.canvases.deleteCanvas);
  const userCanvases = useQuery(api.canvases.listUserCanvases);

  const handleDeleteCanvas = async (canvasId: Id<"canvases">) => {
    if (confirm("Supprimer cet espace ?")) {
      await deleteCanvas({ canvasId });
    }
  };

  function renderUserCanvases() {
    if (!userCanvases) return <div className="p-4">Chargement...</div>;
    if (userCanvases.length === 0)
      return (
        <div className="p-4 text-sm text-muted-foreground">Aucun espace</div>
      );

    return (
      <SidebarMenu>
        {userCanvases.map((c) => (
          <SidebarMenuItem key={c._id}>
            <div className="flex items-center justify-between w-full group">
              <SidebarMenuButton asChild isActive={c._id === canvas?._id}>
                <Link
                  to="/canvas/$canvasId"
                  params={{ canvasId: c._id }}
                  className=""
                >
                  {c.name}
                </Link>
              </SidebarMenuButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6"
                  >
                    <HiDotsVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDeleteCanvas(c._id)}
                    className="text-destructive"
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar">
        <SidebarHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Logo" className="h-5" />
            <span className="font-semibold">Espaces</span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <AiOutlinePlusCircle size={16} />
              </Button>
            </DialogTrigger>
            <CanvasCreationModal />
          </Dialog>
        </SidebarHeader>
        <SidebarContent>{renderUserCanvases()}</SidebarContent>
        <SidebarFooter />
      </Sidebar>

      <SidebarInset className="flex-1">
        <span className="absolute top-2 left-2 z-10">
          <SidebarTrigger />
        </span>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
