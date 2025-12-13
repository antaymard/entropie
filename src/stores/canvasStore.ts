import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Canvas } from "@/types";

type Status = "idle" | "unsynced" | "saving" | "saved" | "error";

interface CanvasStore {
  canvas: Omit<Canvas, "nodes" | "edges"> | null;
  status: Status;
  enableCanvasUndoRedo: boolean;
  currentCanvasTool: "default" | "edge" | "draw" | "frame";
  isAiPanelOpen: boolean;

  setIsAiPanelOpen: (isOpen: boolean) => void;
  setCurrentCanvasTool: (tool: "default" | "edge" | "draw" | "frame") => void;

  setEnableCanvasUndoRedo: (enable: boolean) => void;
  setCanvas: (canvas: Canvas) => void;
  updateCanvas: (
    updates: Partial<
      Omit<Canvas, "nodes" | "edges" | "_id" | "creatorId" | "updatedAt">
    >
  ) => void;
  setStatus: (status: Status) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      canvas: null,
      status: "idle",
      enableCanvasUndoRedo: true,
      currentCanvasTool: "default",
      isAiPanelOpen: true,

      setIsAiPanelOpen: (isOpen: boolean) => {
        set({ isAiPanelOpen: isOpen });
      },

      setCurrentCanvasTool: (tool: "default" | "edge" | "draw") => {
        set({ currentCanvasTool: tool });
      },

      setEnableCanvasUndoRedo: (enable: boolean) => {
        set({ enableCanvasUndoRedo: enable });
      },

      setCanvas: (canvas: Canvas) => {
        set({ canvas });
      },

      updateCanvas: (
        updates: Partial<
          Omit<Canvas, "nodes" | "edges" | "_id" | "creatorId" | "updatedAt">
        >
      ) => {
        const currentCanvas = get().canvas;
        if (!currentCanvas) return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, creatorId, updatedAt, ...safeUpdates } = updates as Record<
          string,
          unknown
        >;
        set({ canvas: { ...currentCanvas, ...safeUpdates } });
      },

      setStatus: (status: Status) => {
        set({ status });
      },
    }),
    { name: "canvas-store" }
  )
);
