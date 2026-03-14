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

export default function SlideshowEditor({
  canvasId,
}: {
  canvasId: Id<"canvases">;
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
    <div className="canvas-ui-container w-[320px] flex-col items-stretch gap-0 overflow-hidden border-slate-300/90 bg-white/95 p-0 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold tracking-wide">Slideshows</h3>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline" className="h-8 w-8">
              <Plus className="size-4" />
              <span className="sr-only">Create slideshow</span>
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

      <Separator />

      <ScrollArea className="max-h-80">
        {slideshows.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No slideshow yet. Click + to create your first one.
          </div>
        ) : (
          <div className="p-2">
            {slideshows.map((slideshow) => (
              <button
                key={slideshow.id}
                type="button"
                className="w-full rounded-md border border-transparent px-2 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
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
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
