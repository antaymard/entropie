import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { useMutation } from "convex/react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useReactFlow, useViewport } from "@xyflow/react";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Button } from "@/components/shadcn/button";
import InlineEditableText from "@/components/form-ui/InlineEditableText";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
  Plus,
  Navigation2,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function SlideshowEditor({
  canvasId,
  slideshowId,
  setLayout,
}: {
  canvasId: Id<"canvases">;
  slideshowId: string;
  setLayout: (layout: string) => void;
}) {
  const { t } = useTranslation();
  const canvas = useCanvasStore((state) => state.canvas);
  const updateSlideshowMutation = useMutation(api.slideshows.update);
  const viewport = useViewport();
  const { setViewport } = useReactFlow();

  const slideshow = useMemo(
    () => canvas?.slideshows?.find((s) => s.id === slideshowId) ?? null,
    [canvas?.slideshows, slideshowId],
  );

  const slides = useMemo(() => slideshow?.slides ?? [], [slideshow?.slides]);

  const renameSlideshow = (newName: string) => {
    if (!slideshow || !newName.trim()) return;
    void updateSlideshowMutation({
      canvasId,
      slideshow: { ...slideshow, name: newName.trim() },
    });
  };

  const updateSlides = (
    newSlides: Array<{ name: string; viewport: unknown }>,
  ) => {
    if (!slideshow) return;
    void updateSlideshowMutation({
      canvasId,
      slideshow: { ...slideshow, slides: newSlides },
    });
  };

  const addSlide = () => {
    const name = `Slide ${slides.length + 1}`;
    updateSlides([...slides, { name, viewport: { ...viewport } }]);
  };

  const deleteSlide = (index: number) => {
    updateSlides(slides.filter((_, i) => i !== index));
  };

  const recaptureSlide = (index: number) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], viewport: { ...viewport } };
    updateSlides(updated);
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= slides.length) return;
    const updated = [...slides];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    updateSlides(updated);
  };

  const renameSlide = (index: number, newName: string) => {
    if (!newName.trim()) return;
    const updated = [...slides];
    updated[index] = {
      ...updated[index],
      name: newName.trim(),
    };
    updateSlides(updated);
  };

  if (!slideshow) {
    return (
      <div className="canvas-ui-container w-48 flex-col items-stretch overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="p-2 text-sm text-muted-foreground">
          Slideshow not found.
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-ui-container w-56 flex-col items-stretch overflow-hidden shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between w-full p-2">
        <InlineEditableText
          value={slideshow.name}
          onSave={renameSlideshow}
          as="h3"
          className="max-w-40 truncate text-sm font-semibold"
          inputClassName="text-sm font-semibold"
          placeholder={t("slideshow.untitledSlideshow")}
        />
        <button
          type="button"
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setLayout("list")}
        >
          Back
        </button>
      </div>

      <ScrollArea className="max-h-60 w-full">
        {slides.length === 0 ? (
          <div className="px-2 pb-2 text-center text-xs text-muted-foreground">
            No slides yet. Capture your current view to add one.
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-1 pb-1">
            {slides.map((slide, index) => (
              <div
                key={`${slide.name}-${index}`}
                className="group rounded-md border border-transparent p-1.5 transition hover:border-slate-200 hover:bg-slate-50"
              >
                <InlineEditableText
                  value={slide.name}
                  onSave={(newName) => renameSlide(index, newName)}
                  as="span"
                  className="max-w-40 truncate text-xs font-medium text-slate-900"
                  inputClassName="text-xs font-medium text-slate-900"
                  placeholder={t("slideshow.untitledSlide")}
                />
                <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-5"
                    title={t("slideshow.goToSlide")}
                    onClick={() => {
                      const v = slide.viewport as {
                        x: number;
                        y: number;
                        zoom: number;
                      };
                      setViewport(v, { duration: 500 });
                    }}
                  >
                    <Navigation2 className="size-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-5"
                    title={t("slideshow.moveUp")}
                    disabled={index === 0}
                    onClick={() => moveSlide(index, "up")}
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-5"
                    title={t("slideshow.moveDown")}
                    disabled={index === slides.length - 1}
                    onClick={() => moveSlide(index, "down")}
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-5"
                    title={t("slideshow.recaptureViewport")}
                    onClick={() => recaptureSlide(index)}
                  >
                    <RefreshCw className="size-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-5 text-destructive hover:text-destructive"
                    title={t("common.delete")}
                    onClick={() => deleteSlide(index)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-1.5">
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={addSlide}
        >
          <Plus className="mr-1 size-3" />
          Capture current view
        </Button>
      </div>
    </div>
  );
}
