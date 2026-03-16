import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { useMutation } from "convex/react";
import { useCanvasStore } from "@/stores/canvasStore";
import { Plus, Presentation } from "lucide-react";
import { useMemo, useState } from "react";
import { TbPlayerPlay } from "react-icons/tb";
import LaunchSlideshowButton from "./LaunchSlideshowButton";

export default function SlideshowList({
  canvasId,
  setLayout,
}: {
  canvasId: Id<"canvases">;
  setLayout: (layout: string) => void;
}) {
  const canvas = useCanvasStore((state) => state.canvas);
  const createSlideshowMutation = useMutation(api.slideshows.create);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const slideshows = useMemo(
    () => canvas?.slideshows || [],
    [canvas?.slideshows],
  );

  const canCreate = title.trim().length > 0 && canvas !== null && !isCreating;

  const createSlideshow = async () => {
    if (!canvas || !title.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await createSlideshowMutation({
        canvasId,
        id: crypto.randomUUID(),
        name: title.trim(),
      });

      setTitle("");
      setIsCreateModalOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="canvas-ui-container w-48 flex-col items-stretch overflow-hidden shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-sm font-semibold pl-2">Slideshows</h3>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Plus className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create slideshow</DialogTitle>
                <DialogDescription>
                  Give your slideshow a title. You can rename it later.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2">
                <Label htmlFor="slideshow-title">Title</Label>
                <Input
                  id="slideshow-title"
                  placeholder="Q2 Product Narrative"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canCreate) {
                      event.preventDefault();
                      void createSlideshow();
                    }
                  }}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setTitle("");
                    setIsCreateModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void createSlideshow()}
                  disabled={!canCreate}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="max-h-40 w-full">
        {slideshows.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No slideshow yet. Click + to create your first one.
          </div>
        ) : (
          <div className="">
            {slideshows.map((slideshow) => (
              <div
                key={slideshow.id}
                className="flex items-center rounded-md border justify-between transition border-transparent hover:border-slate-200 hover:bg-slate-50"
              >
                <div
                  className="w-full   p-2 text-left  "
                  onClick={() => setLayout(slideshow.id)}
                >
                  <div className="flex items-center gap-2">
                    <Presentation className="size-4 text-slate-500" />
                    <span className="line-clamp-1 text-sm font-medium text-slate-900">
                      {slideshow.name}
                    </span>
                  </div>
                  <div className="mt-1 pl-6 text-xs text-muted-foreground">
                    {(slideshow.slides || []).length} slide
                    {(slideshow.slides || []).length > 1 ? "s" : ""}
                  </div>
                </div>
                <LaunchSlideshowButton slideshowId={slideshow.id} />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
