import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useCanvasStore } from "./canvasStore";

interface SlideshowPlaybackState {
  status: "none" | "playing";
  slideshowId: string | null;
  currentSlideIndex: number;
}

interface SlideshowStore {
  playback: SlideshowPlaybackState;

  startSlideshow: (slideshowId: string) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  stopSlideshow: () => void;
}

export const useSlideshowStore = create<SlideshowStore>()(
  devtools(
    (set, get) => ({
      playback: {
        status: "none",
        slideshowId: null,
        currentSlideIndex: 0,
      },

      startSlideshow: (slideshowId) => {
        set({
          playback: {
            status: "playing",
            slideshowId,
            currentSlideIndex: 0,
          },
        });
      },

      nextSlide: () => {
        const { playback } = get();
        const canvas = useCanvasStore.getState().canvas;
        const slideshow = canvas?.slideshows?.find(
          (s) => s.id === playback.slideshowId,
        );
        const slidesLength = slideshow?.slides?.length ?? 0;
        if (playback.currentSlideIndex >= slidesLength - 1) return;
        set({
          playback: {
            ...playback,
            currentSlideIndex: playback.currentSlideIndex + 1,
          },
        });
      },

      previousSlide: () => {
        const { playback } = get();
        if (playback.currentSlideIndex <= 0) return;
        set({
          playback: {
            ...playback,
            currentSlideIndex: playback.currentSlideIndex - 1,
          },
        });
      },

      stopSlideshow: () => {
        set({
          playback: {
            status: "none",
            slideshowId: null,
            currentSlideIndex: 0,
          },
        });
      },
    }),
    { name: "slideshow-store" },
  ),
);
