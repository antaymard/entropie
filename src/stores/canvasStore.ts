import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Canvas } from "@/types";

type Status = "idle" | "unsynced" | "saving" | "saved" | "error";
type Focus = "canvas" | "platejs";

interface CanvasStore {
  canvas: Omit<Canvas, "nodes" | "edges"> | null;
  status: Status;
  focus: Focus;

  setCanvas: (canvas: Canvas) => void;
  setStatus: (status: Status) => void;
  setFocus: (focus: Focus) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      canvas: null,
      status: "idle",
      focus: "canvas",

      setFocus: (focus: Focus) => {
        set({ focus });
      },
      setCanvas: (canvas: Canvas) => {
        set({ canvas });
      },
      setStatus: (status: Status) => {
        set({ status });
      },
    }),
    { name: "canvas-store" },
  ),
);
