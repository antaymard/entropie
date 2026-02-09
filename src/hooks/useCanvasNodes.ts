import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  useNodesState,
  type Node,
  type NodeAddChange,
  type NodeChange,
  type NodeDimensionChange,
  type NodePositionChange,
  type NodeRemoveChange,
} from "@xyflow/react";
import { useMutation } from "convex/react";
import { throttle } from "lodash";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import {
  fromCanvasNodesToXyNodes,
  fromXyNodesToCanvasNodes,
} from "@/lib/node-types-converter";
import type { CanvasNode } from "@/types";

export function useCanvasNodes(
  canvasId: Id<"canvases">,
  canvasNodes?: CanvasNode[],
) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  const lastPositionChangesWhenResizing = useRef<NodePositionChange[] | null>(
    null,
  );

  // CONVEX MUTATIONS
  const addCanvasNodesToConvex = useMutation(api.canvasNodes.add);
  const updateCanvasNodesPositionOrDimensionsInConvex = useMutation(
    api.canvasNodes.updatePositionOrDimensions,
  );
  const removeCanvasNodesToConvex = useMutation(api.canvasNodes.remove);

  const throttledUpdatePositions = useMemo(
    () =>
      throttle((changes: NodePositionChange[]) => {
        updateCanvasNodesPositionOrDimensionsInConvex({
          canvasId,
          nodeChanges: changes,
        });
      }, 300),
    [canvasId, updateCanvasNodesPositionOrDimensionsInConvex],
  );

  // Cleanup throttle on unmount or when dependencies change
  useEffect(() => {
    return () => {
      throttledUpdatePositions.cancel();
    };
  }, [throttledUpdatePositions]);

  // Sync convex -> reactflow nodes, en préservant les nodes en cours
  // de drag/resize et la sélection
  useEffect(() => {
    if (canvasNodes !== undefined) {
      if (canvasNodes.length === 0) {
        setNodes([]);
        return;
      }
      setNodes((currentNodes: Node[]) => {
        const newNodes = fromCanvasNodesToXyNodes(canvasNodes);
        const currentNodesMap = new Map(currentNodes.map((n) => [n.id, n]));

        return newNodes.map((newNode) => {
          const currentNode = currentNodesMap.get(newNode.id);

          // Si le node est en cours de drag ou resize, on garde le currentNode complet
          if (currentNode?.dragging || (currentNode as Node)?.resizing) {
            return currentNode as Node;
          }

          // Sinon, on prend le newNode mais on préserve la sélection
          if (currentNode?.selected) {
            return { ...newNode, selected: true } as Node;
          }

          return newNode as Node;
        });
      });
    }
  }, [canvasNodes]);

  const handleNodeChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      const addedChanges = changes.filter(
        (change: NodeChange) => change.type === "add",
      ) as NodeAddChange[];
      const positionChanges = changes.filter(
        (change: NodeChange) => change.type === "position",
      ) as NodePositionChange[];
      const dimensionChanges = changes.filter(
        (change: NodeChange) => change.type === "dimensions",
      ) as NodeDimensionChange[];
      const removedChanges = changes.filter(
        (change: NodeChange) => change.type === "remove",
      ) as NodeRemoveChange[];

      // ADD NODES
      if (addedChanges.length > 0) {
        // Envoi direct à Convex
        return addCanvasNodesToConvex({
          canvasNodes: fromXyNodesToCanvasNodes(
            addedChanges.map((c) => c.item) as Node[],
          ),
          canvasId,
        });
      } else if (removedChanges.length > 0) {
        // REMOVE NODES
        // Envoi direct à Convex
        removeCanvasNodesToConvex({
          nodeCanvasIds: removedChanges.map((c) => c.id),
          canvasId,
        });
      } else if (dimensionChanges.length > 0) {
        // UPDATE NODES DIMENSIONS
        if (
          dimensionChanges.some(
            (change) => (change as NodeDimensionChange).resizing,
          )
        ) {
          if (positionChanges.length > 0) {
            // Sauvegarder les positionChanges pendant le resize
            lastPositionChangesWhenResizing.current = positionChanges;
          }
        } else {
          // Fusionner les dimensionChanges et positionChanges par node ID
          const savedPositionChanges =
            lastPositionChangesWhenResizing.current || [];
          const mergedChanges = dimensionChanges.map((dimChange) => {
            const posChange = savedPositionChanges.find(
              (p) => p.id === dimChange.id,
            );
            return {
              type: "dimensions" as const,
              id: dimChange.id,
              dimensions: dimChange.dimensions,
              position: posChange?.position,
            };
          });

          updateCanvasNodesPositionOrDimensionsInConvex({
            canvasId,
            nodeChanges: mergedChanges,
          });
          lastPositionChangesWhenResizing.current = null;
        }
      } else if (positionChanges.length > 0) {
        // UPDATE NODES POSITIONS
        if (
          positionChanges.some((change) => change.dragging) &&
          dimensionChanges.length === 0
        ) {
          // Throttle l'envoi à Convex pendant le drag (toutes les 300ms)
          throttledUpdatePositions(positionChanges);
        } else {
          // Envoi direct à Convex quand le drag est fini
          return updateCanvasNodesPositionOrDimensionsInConvex({
            canvasId,
            nodeChanges: positionChanges,
          });
        }
      }
    },
    [
      canvasId,
      addCanvasNodesToConvex,
      removeCanvasNodesToConvex,
      updateCanvasNodesPositionOrDimensionsInConvex,
      throttledUpdatePositions,
      onNodesChange,
    ],
  );

  return {
    nodes,
    setNodes,
    handleNodeChange,
  };
}
