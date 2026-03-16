import { Button } from "@/components/shadcn/button";
import { useSlideshowPlayback } from "@/hooks/useSlideshowPlayback";
import { TbArrowLeftBar, TbArrowRightBar, TbX } from "react-icons/tb";
import { Kbd } from "@/components/shadcn/kbd";
import { useHotkey } from "@tanstack/react-hotkeys";

export default function SlideshowProgressToolbar() {
  const {
    isPlaying,
    isFirst,
    isLast,
    currentSlideIndex,
    totalSlides,
    next,
    previous,
    stop,
  } = useSlideshowPlayback();

  useHotkey({ key: "ArrowRight" }, next, { enabled: isPlaying && !isLast });
  useHotkey({ key: "ArrowLeft" }, previous, { enabled: isPlaying && !isFirst });
  useHotkey({ key: "Escape" }, stop, { enabled: isPlaying });

  return (
    <div className="canvas-ui-container">
      <Button variant="ghost" size="sm" onClick={previous} disabled={isFirst}>
        Previous
        <Kbd>
          <TbArrowLeftBar />
        </Kbd>
      </Button>
      <span className="text-xs tabular-nums px-1">
        {currentSlideIndex + 1} / {totalSlides}
      </span>
      <Button variant="ghost" size="sm" onClick={next} disabled={isLast}>
        Next
        <Kbd>
          <TbArrowRightBar />
        </Kbd>
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={stop}>
        <TbX />
      </Button>
    </div>
  );
}
