import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type { Edge, NodeChange, EdgeChange } from "@xyflow/react";
import { devtools } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import type { CanvasNode } from "../types/node.types";
import type { Id } from "../../convex/_generated/dataModel";
import { saveCanvasToDbDebounced } from "../api";
import type { Canvas } from "@/types";
import { toCanvasNodes, toXyNodes } from "@/components/utils/nodeUtils";

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
