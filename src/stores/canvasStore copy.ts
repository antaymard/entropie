import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type { Edge, NodeChange, EdgeChange } from "@xyflow/react";
import { devtools } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import type { CanvasNode } from "../types/node.types";
import type { Id } from "../../convex/_generated/dataModel";
import { saveCanvasToDbDebounced } from "../api";
import type { Canvas } from "@/types";

interface CanvasStore extends Canvas {

  setCanvasId: (id: Id<"canvases"> | null) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: Edge[]) => void;

  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  updateNode: (id: string, updates: Partial<CanvasNode>) => void;
  addNode: (node: CanvasNode) => void;
  deleteNode: (id: string) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      _id: null,
      nodes: [],
      edges: [],

      intiCanvas: (canvas) => set(canvas),

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
        const { canvasId, nodes, edges } = get();
        if (canvasId) saveCanvasToDbDebounced(canvasId, nodes, edges);
      },

      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
        const { canvasId, nodes, edges } = get();
        if (canvasId) saveCanvasToDbDebounced(canvasId, nodes, edges);
      },

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      updateNodeData: (id, data) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n
          ),
        });
        const { canvasId, nodes, edges } = get();
        if (canvasId) saveCanvasToDbDebounced(canvasId, nodes, edges);
      },

      updateNode: (id, updates) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        });
        const { canvasId, nodes, edges } = get();
        if (canvasId) saveCanvasToDbDebounced(canvasId, nodes, edges);
      },

      addNode: (node) => {
        set({
          nodes: [...get().nodes, node],
        });
        const { canvasId, nodes, edges } = get();
        if (canvasId) saveCanvasToDbDebounced(canvasId, nodes, edges);
      },

      deleteNode: (id) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        });
        const { canvasId, nodes, edges } = get();
        if (canvasId) saveCanvasToDbDebounced(canvasId, nodes, edges);
      },
    }),
    { name: "canvas-store" }
  )
);

// Hook helper pour récupérer un node spécifique (optimisé)
// OPTIMISATION: Utilise shallow pour éviter les rerenders inutiles
// - Sans shallow: rerender à CHAQUE changement du store (même si ce node n'a pas changé)
// - Avec shallow: rerender uniquement si les propriétés du node ont changé
// - Impact: Réduit les rerenders de O(n²) à O(1) lors des déplacements
export const useNode = (nodeId: string): CanvasNode | undefined => {
  return useCanvasStore(
    (state) => state.nodes.find((n) => n.id === nodeId),
    shallow // Compare le node retourné par shallow equality (compare chaque propriété)
  );
};


