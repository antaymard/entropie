import { memo } from "react";
import { useSlideshowStore } from "@/stores/slideshowStore";
import SlideshowProgressToolbar from "./slideshow/SlideshowProgressToolbar";

function BottomToolbar() {
  const isPlaying = useSlideshowStore(
    (state) => state.playback.status === "playing",
  );

  if (!isPlaying) return null;

  return <SlideshowProgressToolbar />;
}

export default memo(BottomToolbar);
