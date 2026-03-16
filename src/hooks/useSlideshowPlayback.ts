import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useSlideshowStore } from "@/stores/slideshowStore";

type Viewport = { x: number; y: number; zoom: number };

export function useSlideshowPlayback() {
  const { setViewport } = useReactFlow();

  const { playback, startSlideshow, nextSlide, previousSlide, stopSlideshow } =
    useSlideshowStore();

  const canvas = useCanvasStore((state) => state.canvas);

  const currentSlideshow = canvas?.slideshows?.find(
    (s) => s.id === playback.slideshowId,
  );
  const slides = currentSlideshow?.slides ?? [];
  const totalSlides = slides.length;
  const { currentSlideIndex } = playback;
  const isPlaying = playback.status === "playing";
  const isFirst = currentSlideIndex === 0;
  const isLast = totalSlides === 0 || currentSlideIndex >= totalSlides - 1;

  const goToViewport = (index: number, duration = 500) => {
    const viewport = slides[index]?.viewport as Viewport | undefined;
    if (viewport) setViewport(viewport, { duration });
  };

  const start = (slideshowId: string) => {
    startSlideshow(slideshowId);
    const firstSlide = canvas?.slideshows?.find((s) => s.id === slideshowId)
      ?.slides?.[0];
    if (firstSlide?.viewport) {
      setViewport(firstSlide.viewport as Viewport, { duration: 500 });
    }
  };

  const next = () => {
    if (isLast) return;
    goToViewport(currentSlideIndex + 1);
    nextSlide();
  };

  const previous = () => {
    if (isFirst) return;
    goToViewport(currentSlideIndex - 1);
    previousSlide();
  };

  return {
    isPlaying,
    isFirst,
    isLast,
    currentSlideIndex,
    totalSlides,
    slides,
    start,
    next,
    previous,
    stop: stopSlideshow,
  };
}
