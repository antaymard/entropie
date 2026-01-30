import { useCallback } from "react";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import type { Id } from "@/../convex/_generated/dataModel";

/**
 * Hook optimisé pour récupérer les values d'un NodeData.
 * Ne re-render que si les values de CE NodeData changent.
 */
export function useNodeDataValues(
  nodeDataId: Id<"nodeDatas"> | undefined
): Record<string, unknown> | undefined {
  return useNodeDataStore(
    useCallback(
      (state) => {
        if (!nodeDataId) return undefined;
        return state.nodeDatas.get(nodeDataId)?.values;
      },
      [nodeDataId]
    )
  );
}
