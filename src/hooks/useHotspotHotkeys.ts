import { useHotkey } from "@tanstack/react-hotkeys";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvasStore";

const HOTSPOT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

type Viewport = { x: number; y: number; zoom: number };

function useHotspotKey(index: number, total: number) {
  const canvas = useCanvasStore((state) => state.canvas);
  const { setViewport } = useReactFlow();

  const key = HOTSPOT_KEYS[index];

  useHotkey(
    { key, alt: true },
    (event) => {
      event.preventDefault();
      const hotspot = canvas?.hotspots?.[index];
      if (!hotspot) return;
      setViewport(hotspot.viewport as Viewport, { duration: 500 });
    },
    { enabled: index < total },
  );
}

export function useHotspotHotkeys() {
  const total = useCanvasStore((state) =>
    Math.min(state.canvas?.hotspots?.length ?? 0, HOTSPOT_KEYS.length),
  );

  useHotspotKey(0, total);
  useHotspotKey(1, total);
  useHotspotKey(2, total);
  useHotspotKey(3, total);
  useHotspotKey(4, total);
  useHotspotKey(5, total);
  useHotspotKey(6, total);
  useHotspotKey(7, total);
  useHotspotKey(8, total);
}
