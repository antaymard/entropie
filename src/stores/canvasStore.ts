import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type { Node, Edge, NodeChange, EdgeChange } from "@xyflow/react";
import { devtools } from "zustand/middleware";

interface CanvasStore {
  nodes: Node[];
  edges: Edge[];

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  addNode: (node: Node) => void;
  deleteNode: (id: string) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      nodes: [],
      edges: [],

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },

      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      updateNodeData: (id, data) =>
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n
          ),
        }),

      addNode: (node) =>
        set({
          nodes: [...get().nodes, node],
        }),

      deleteNode: (id) =>
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        }),
    }),
    { name: "canvas-store" }
  )
);

// Hook helper pour récupérer un node spécifique (optimisé)
export const useNode = (nodeId: string) => {
  return useCanvasStore((state) => state.nodes.find((n) => n.id === nodeId));
};
