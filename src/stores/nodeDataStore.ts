import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Id } from "@/../convex/_generated/dataModel";
import type { NodeData } from "@/types/convex";

interface NodeDataStore {
  // Map pour O(1) lookup
  nodeDatas: Map<Id<"nodeDatas">, NodeData>;

  // Actions
  setNodeDatas: (nodeDatas: NodeData[]) => void;
  getNodeData: (id: Id<"nodeDatas">) => NodeData | undefined;
  updateNodeData: (
    id: Id<"nodeDatas">,
    values: Record<string, unknown>,
  ) => void;
  setNodeData: (id: Id<"nodeDatas">, nodeData: NodeData) => void;
  clear: () => void;
}

export const useNodeDataStore = create<NodeDataStore>()(
  devtools(
    (set, get) => ({
      nodeDatas: new Map(),

      setNodeDatas: (nodeDatas) => {
        set((state) => {
          const newMap = new Map(state.nodeDatas);
          let changed = false;
          const incomingIds = new Set<Id<"nodeDatas">>();

          for (const nd of nodeDatas) {
            incomingIds.add(nd._id);
            const existing = newMap.get(nd._id);
            if (
              !existing ||
              existing.updatedAt !== nd.updatedAt ||
              existing.automationMode !== nd.automationMode ||
              existing.status !== nd.status ||
              existing.automationProgress?.currentStepType !==
                nd.automationProgress?.currentStepType
            ) {
              newMap.set(nd._id, nd);
              changed = true;
            }
          }

          for (const key of newMap.keys()) {
            if (!incomingIds.has(key)) {
              newMap.delete(key);
              changed = true;
            }
          }

          return changed ? { nodeDatas: newMap } : state;
        });
      },

      getNodeData: (id) => get().nodeDatas.get(id),

      updateNodeData: (id, values) => {
        set((state) => {
          const existing = state.nodeDatas.get(id);
          if (!existing) return state;

          const newMap = new Map(state.nodeDatas);
          newMap.set(id, {
            ...existing,
            values: { ...existing.values, ...values },
          });
          return { nodeDatas: newMap };
        });
      },

      setNodeData: (id, nodeData) => {
        set((state) => {
          const newMap = new Map(state.nodeDatas);
          newMap.set(id, nodeData);
          return { nodeDatas: newMap };
        });
      },

      clear: () => set({ nodeDatas: new Map() }),
    }),
    { name: "nodeData-store" },
  ),
);
