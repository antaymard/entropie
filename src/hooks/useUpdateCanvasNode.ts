import { useCallback, useRef } from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import { useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import type { colorsEnum } from "@/types/style.types";
import { toastError } from "@/components/utils/errorUtils";

interface ConvexNodeProps {
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
  color?: colorsEnum;
}

interface UpdateNodeInput {
  nodeId: string;
  props?: ConvexNodeProps;
  data?: Record<string, unknown>;
}

interface UseUpdateCanvasNodeReturn {
  updateCanvasNode: (input: UpdateNodeInput) => Promise<void>;
  updateCanvasNodes: (inputs: UpdateNodeInput[]) => Promise<void>;
  isUpdating: boolean;
}

export function useUpdateCanvasNode(): UseUpdateCanvasNodeReturn {
  const { canvasId }: { canvasId: Id<"canvases"> } = useParams({
    from: "/canvas/$canvasId",
  });

  const {
    getNode,
    updateNode: rfUpdateNode,
    updateNodeData,
    setNodes,
  } = useReactFlow();

  const updateCanvasNodesMutation = useMutation(
    api.canvasNodes.updateCanvasNodes,
  );

  const snapshotsRef = useRef<Map<string, Node>>(new Map());
  const isUpdatingRef = useRef(false);

  const saveSnapshot = useCallback(
    (nodeId: string): boolean => {
      const node = getNode(nodeId);
      if (!node) {
        console.warn(`[useUpdateCanvasNode] Node ${nodeId} not found`);
        return false;
      }
      snapshotsRef.current.set(nodeId, JSON.parse(JSON.stringify(node)));
      return true;
    },
    [getNode],
  );

  const clearSnapshot = useCallback((nodeId: string) => {
    snapshotsRef.current.delete(nodeId);
  }, []);

  const revertNodes = useCallback(
    (nodeIds: string[]) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (!nodeIds.includes(node.id)) return node;
          const snapshot = snapshotsRef.current.get(node.id);
          return snapshot ?? node;
        }),
      );
      nodeIds.forEach((id) => snapshotsRef.current.delete(id));
    },
    [setNodes],
  );

  const applyLocalUpdate = useCallback(
    (input: UpdateNodeInput) => {
      const { nodeId, props, data } = input;

      if (props) {
        const structuralUpdate: Partial<Node> = {};
        if (props.locked !== undefined)
          structuralUpdate.draggable = !props.locked;
        if (props.hidden !== undefined) structuralUpdate.hidden = props.hidden;
        if (props.zIndex !== undefined) structuralUpdate.zIndex = props.zIndex;

        if (Object.keys(structuralUpdate).length > 0) {
          rfUpdateNode(nodeId, structuralUpdate);
        }
      }

      const dataUpdate: Record<string, unknown> = {};
      if (props?.color !== undefined) dataUpdate.color = props.color;
      if (data) Object.assign(dataUpdate, data);

      if (Object.keys(dataUpdate).length > 0) {
        updateNodeData(nodeId, dataUpdate);
      }
    },
    [rfUpdateNode, updateNodeData],
  );

  const executeServerUpdate = useCallback(
    async (inputs: UpdateNodeInput[]): Promise<void> => {
      const nodeProps = inputs.map(({ nodeId, props, data }) => ({
        id: nodeId,
        ...(props && { props }),
        ...(data && { data }),
      }));

      await updateCanvasNodesMutation({
        canvasId,
        nodeProps,
      });
    },
    [canvasId, updateCanvasNodesMutation],
  );

  const updateNodes = useCallback(
    async (inputs: UpdateNodeInput[]): Promise<void> => {
      if (inputs.length === 0) return;

      const validInputs = inputs.filter((input) => saveSnapshot(input.nodeId));
      if (validInputs.length === 0) return;

      isUpdatingRef.current = true;
      validInputs.forEach(applyLocalUpdate);

      try {
        await executeServerUpdate(validInputs);
        validInputs.forEach((input) => clearSnapshot(input.nodeId));
      } catch (error) {
        revertNodes(validInputs.map((i) => i.nodeId));
        toastError(error, "Erreur lors de la mise à jour");
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [
      saveSnapshot,
      applyLocalUpdate,
      executeServerUpdate,
      clearSnapshot,
      revertNodes,
    ],
  );

  const updateNode = useCallback(
    async (input: UpdateNodeInput): Promise<void> => {
      return updateNodes([input]);
    },
    [updateNodes],
  );

  return {
    updateCanvasNode: updateNode,
    updateCanvasNodes: updateNodes,
    get isUpdating() {
      return isUpdatingRef.current;
    },
  };
}
