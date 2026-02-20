import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
} from "@/components/shadcn/sidebar";
import { Button } from "@/components/shadcn/button";
import { api } from "@/../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogTrigger } from "@/components/shadcn/dialog";
import CanvasCreationModal from "./CanvasCreationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { HiDotsVertical } from "react-icons/hi";
import { TbPlus } from "react-icons/tb";
import { cn } from "@/lib/utils";
import InlineEditableText from "@/components/form-ui/InlineEditableText";

export default function CanvasSidebar({
  children,
  canvasId,
}: {
  children: React.ReactNode;
  canvasId: Id<"canvases">;
}) {
  const deleteCanvas = useMutation(api.canvases.deleteCanvas);
  const updateCanvasProps = useMutation(api.canvases.updateProps);
  const userCanvases = useQuery(api.canvases.listUserCanvases);

  const currentCanvasName = userCanvases?.find((c) => c._id === canvasId)?.name;

  const handleDeleteCanvas = async (canvasId: Id<"canvases">) => {
    if (confirm("Delete this workspace?")) {
      await deleteCanvas({ canvasId });
    }
  };

  const handleUpdateCanvasName = async (newName: string) => {
    if (newName.trim() && newName !== currentCanvasName) {
      await updateCanvasProps({ canvasId, name: newName.trim() });
    }
  };

  function renderUserCanvases() {
    if (!userCanvases) return <div className="p-4">Loading...</div>;
    if (userCanvases.length === 0)
      return (
        <div className="p-4 text-sm text-muted-foreground">No workspaces</div>
      );

    return (
      <SidebarMenu>
        {userCanvases.map((c) => (
          <div key={c._id}>
            <div className="flex items-center justify-between w-full group px-2">
              <Link
                to="/canvas/$canvasId"
                params={{ canvasId: c._id }}
                className={cn(
                  "text-base! font-medium px-2 py-1 flex-1 min-w-0 truncate  rounded-md",
                  c._id === canvasId ? "bg-slate-200" : "hover:bg-slate-100",
                )}
              >
                {c.name}
              </Link>

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
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </SidebarMenu>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar variant="sidebar">
        <SidebarHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <InlineEditableText
              value={currentCanvasName ?? "..."}
              onSave={handleUpdateCanvasName}
              className="font-semibold text-lg truncate"
              placeholder="Workspace name"
              as="span"
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <TbPlus size={16} />
              </Button>
            </DialogTrigger>
            <CanvasCreationModal />
          </Dialog>
        </SidebarHeader>
        <SidebarContent className="py-4">
          <h3 className="px-4">Workspaces</h3>
          {renderUserCanvases()}
        </SidebarContent>
        <SidebarFooter></SidebarFooter>
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
