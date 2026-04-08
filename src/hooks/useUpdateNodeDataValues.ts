import { useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { toastError } from "@/components/utils/errorUtils";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import type { Doc } from "@/../convex/_generated/dataModel";

interface UpdateNodeDataInput {
  nodeDataId: Id<"nodeDatas">;
  values: Record<string, unknown>;
}

interface UseUpdateNodeDataValuesReturn {
  updateNodeDataValues: (input: UpdateNodeDataInput) => Promise<void>;
  isUpdating: boolean;
}

export function useUpdateNodeDataValues(): UseUpdateNodeDataValuesReturn {
  const updateValuesMutation = useMutation(api.nodeDatas.updateValues);

  const {
    getNodeData,
    updateNodeData: updateStoreNodeData,
    setNodeData,
  } = useNodeDataStore();

  const snapshotsRef = useRef<Map<Id<"nodeDatas">, Doc<"nodeDatas">>>(
    new Map(),
  );
  const isUpdatingRef = useRef(false);

  const saveSnapshot = useCallback(
    (nodeDataId: Id<"nodeDatas">): boolean => {
      const nodeData = getNodeData(nodeDataId);
      if (!nodeData) {
        console.warn(
          `[useUpdateNodeDataValues] NodeData ${nodeDataId} not found in store`,
        );
        return false;
      }
      snapshotsRef.current.set(nodeDataId, structuredClone(nodeData));
      return true;
    },
    [getNodeData],
  );

  const revertNodeData = useCallback(
    (nodeDataId: Id<"nodeDatas">) => {
      const snapshot = snapshotsRef.current.get(nodeDataId);
      if (snapshot) {
        setNodeData(nodeDataId, snapshot);
        snapshotsRef.current.delete(nodeDataId);
      }
    },
    [setNodeData],
  );

  const updateNodeDataValues = useCallback(
    async (input: UpdateNodeDataInput): Promise<void> => {
      const { nodeDataId, values } = input;
      const nodeData = getNodeData(nodeDataId);
      const isDocument = nodeData?.type === "document";

      // Documents : pas d'optimistic update — l'éditeur garde son état local,
      // le canvas preview se met à jour au retour de la subscription Convex.
      // La mutation Convex gère le stringify avant stockage.
      // Autres types : optimistic update classique avec snapshot/rollback.
      if (!isDocument) {
        const snapshotSaved = saveSnapshot(nodeDataId);
        if (!snapshotSaved) return;
        isUpdatingRef.current = true;
        updateStoreNodeData(nodeDataId, values);
      } else {
        isUpdatingRef.current = true;
      }

      try {
        await updateValuesMutation({
          _id: nodeDataId,
          values,
        });
        if (!isDocument) {
          snapshotsRef.current.delete(nodeDataId);
        }
      } catch (error) {
        if (!isDocument) {
          revertNodeData(nodeDataId);
        }
        toastError(error, "Error updating");
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [
      getNodeData,
      updateValuesMutation,
      updateStoreNodeData,
      saveSnapshot,
      revertNodeData,
    ],
  );

  return {
    updateNodeDataValues,
    isUpdating: isUpdatingRef.current,
  };
}
