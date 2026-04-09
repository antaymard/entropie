import { Button } from "@/components/shadcn/button";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCanvasStore } from "@/stores/canvasStore";
import SlideshowContainer from "./slideshow/SlideshowContainer";
import SlideshowProgressToolbar from "./slideshow/SlideshowProgressToolbar";
import { BiSlideshow } from "react-icons/bi";
import { TbPlus, TbSearch, TbUpload, TbX } from "react-icons/tb";
import { Kbd } from "@/components/shadcn/kbd";
import { useSlideshowStore } from "@/stores/slideshowStore";

export default function CanvasToolbar({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  const tool = useCanvasStore((state) => state.tool);
  const setTool = useCanvasStore((state) => state.setTool);
  const isSearchModalOpen = useCanvasStore((state) => state.isSearchModalOpen);
  const toggleSearchModal = useCanvasStore((state) => state.toggleSearchModal);
  const isPlaying = useSlideshowStore(
    (state) => state.playback.status === "playing",
  );

  if (isPlaying) {
    return <SlideshowProgressToolbar />;
  }

  return (
    <div className="flex flex-col-reverse items-center gap-3">
      <div className="canvas-ui-container px-0!">
        <Button variant="default" size="icon">
          <TbPlus size={20} />
        </Button>
        {/* <Button variant="ghost" size="icon">
          <TbUpload size={20} />
        </Button> */}
        <Button
          variant={isSearchModalOpen ? "default" : "ghost"}
          size="default"
          onClick={() => toggleSearchModal()}
        >
          <TbSearch size={20} />
          <Kbd>Ctrl + K</Kbd>
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
          {tool === "slides" ? <TbX size={20} /> : <BiSlideshow size={20} />}
        </Button>
      </div>
      {tool === "slides" && <SlideshowContainer canvasId={canvasId} />}
    </div>
  );
}
