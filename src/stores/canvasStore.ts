import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Canvas } from "@/types";

interface CanvasStore {
  canvas: Omit<Canvas, "nodes" | "edges"> | null;
  setCanvas: (canvas: Canvas) => void;

}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      canvas: null,

      setCanvas: (canvas: Canvas) => {
        set({ canvas });
      },

    }),
    { name: "canvas-store" }
  )
);
