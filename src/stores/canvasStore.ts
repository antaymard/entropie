import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Doc } from "@/../convex/_generated/dataModel";
import type { CanvasPermission } from "@/../convex/lib/auth";

type CanvasInStore = Omit<Doc<"canvases">, "nodes" | "edges"> & {
  _permission: CanvasPermission;
};

type Status = "idle" | "unsynced" | "saving" | "saved" | "error";
type Focus = "canvas" | "platejs";
type Tool = "edit" | "slides" | "draw";

interface CanvasStore {
  canvas: CanvasInStore | null;
  status: Status;
  focus: Focus;
  tool: Tool;

  setCanvas: (canvas: CanvasInStore | null) => void;
  setStatus: (status: Status) => void;
  setFocus: (focus: Focus) => void;
  setTool: (tool: Tool) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      canvas: null,
      status: "idle",
      focus: "canvas",
      tool: "edit",

      setTool: (tool) => {
        set({ tool });
      },
      setFocus: (focus) => {
        set({ focus });
      },
      setCanvas: (canvas) => {
        set({ canvas });
      },
      setStatus: (status) => {
        set({ status });
      },
    }),
    { name: "canvas-store" },
  ),
);
