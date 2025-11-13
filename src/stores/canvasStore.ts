import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Canvas } from "@/types";

type Status = "idle" | "unsynced" | "saving" | "saved" | "error";

interface CanvasStore {
  canvas: Omit<Canvas, "nodes" | "edges"> | null;
  status: Status;
  setCanvas: (canvas: Canvas) => void;
  setStatus: (status: Status) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      canvas: null,
      status: "idle",

      setCanvas: (canvas: Canvas) => {
        set({ canvas });
      },

      setStatus: (status: Status) => {
        set({ status });
      },
    }),
    { name: "canvas-store" }
  )
);
