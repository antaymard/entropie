import { useCallback } from "react";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import type { Id } from "@/../convex/_generated/dataModel";
import { getNodeDataTitle } from "@/components/utils/nodeDataDisplayUtils";

export function useNodeDataTitle(
  nodeDataId: Id<"nodeDatas"> | undefined,
): string | undefined {
  return useNodeDataStore(
    useCallback(
      (state) => {
        if (!nodeDataId) return undefined;
        const nodeData = state.nodeDatas.get(nodeDataId);
        if (!nodeData) return undefined;
        return getNodeDataTitle(nodeData);
      },
      [nodeDataId],
    ),
  );
}
