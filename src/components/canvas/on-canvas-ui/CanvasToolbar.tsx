import { Button } from "@/components/shadcn/button";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCanvasStore } from "@/stores/canvasStore";
import SlideshowContainer from "./slideshow/SlideshowContainer";
import { BiSlideshow } from "react-icons/bi";
import { TbPlus, TbSearch, TbUpload } from "react-icons/tb";

export default function CanvasToolbar({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  const tool = useCanvasStore((state) => state.tool);
  const setTool = useCanvasStore((state) => state.setTool);

  return (
    <div className="flex flex-col-reverse items-center gap-3">
      <div className="canvas-ui-container px-0!">
        <Button variant="default" size="icon">
          <TbPlus size={20} />
        </Button>
        <Button variant="ghost" size="icon">
          <TbUpload size={20} />
        </Button>
        <Button variant="ghost" size="icon">
          <TbSearch size={20} />
        </Button>
        <Button
          variant={tool === "slides" ? "default" : "ghost"}
          size="icon"
          onClick={() => {
            if (tool === "slides") {
              setTool("edit");
            } else {
              setTool("slides");
            }
          }}
        >
          <BiSlideshow size={20} />
        </Button>
      </div>
      {tool === "slides" && <SlideshowContainer canvasId={canvasId} />}
    </div>
  );
}
