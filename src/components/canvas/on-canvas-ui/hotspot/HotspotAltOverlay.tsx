import { useEffect, useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { Kbd } from "@/components/shadcn/kbd";

export default function HotspotAltOverlay() {
  const canvas = useCanvasStore((state) => state.canvas);
  const focus = useCanvasStore((state) => state.focus);
  const [isAltHeld, setIsAltHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltHeld(false);
    };
    const handleBlur = () => setIsAltHeld(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const hotspots = canvas?.hotspots ?? [];

  if (!isAltHeld || focus !== "canvas" || hotspots.length === 0) {
    return null;
  }

  return (
    <div className="canvas-ui-container px-2 py-1 gap-3 text-xs text-muted-foreground opacity-80">
      {hotspots.slice(0, 9).map((hotspot, index) => (
        <div key={hotspot.id} className="flex items-center gap-1.5">
          <Kbd className="text-[10px] shrink-0">{index + 1}</Kbd>
          <span className="max-w-24 truncate">{hotspot.name}</span>
        </div>
      ))}
    </div>
  );
}
