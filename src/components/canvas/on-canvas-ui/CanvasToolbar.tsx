import { Button } from "@/components/shadcn/button";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCanvasStore } from "@/stores/canvasStore";
import SlideshowContainer from "./slideshow/SlideshowContainer";
import { BiSlideshow } from "react-icons/bi";
import { TbClick } from "react-icons/tb";

export default function CanvasToolbar({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  const tool = useCanvasStore((state) => state.tool);
  const setTool = useCanvasStore((state) => state.setTool);

  return (
    <div className="flex items-start gap-3">
      <div className="canvas-ui-container flex-col">
        <Button
          variant={tool === "edit" ? "default" : "ghost"}
          size="icon"
          onClick={() => setTool("edit")}
        >
          <TbClick size={20} />
        </Button>
        <Button
          variant={tool === "slides" ? "default" : "ghost"}
          size="icon"
          onClick={() => setTool("slides")}
        >
          <BiSlideshow size={20} />
        </Button>
      </div>
      {tool === "slides" && <SlideshowContainer canvasId={canvasId} />}
    </div>
  );
}
