import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  useNodesState,
  useReactFlow,
  type Node,
  type NodeAddChange,
  type NodeChange,
  type NodeDimensionChange,
  type NodePositionChange,
  type NodeRemoveChange,
} from "@xyflow/react";
import { useMutation } from "convex/react";
import { throttle } from "lodash";
import { useKeyHold } from "@tanstack/react-hotkeys";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import {
  fromCanvasNodesToXyNodes,
  fromXyNodesToCanvasNodes,
} from "@/lib/node-types-converter";
import type { CanvasNode } from "@/types";
import { useWindowsStore } from "@/stores/windowsStore";

const HYDRATION_BATCH_SIZE = 8;
const HYDRATION_GAP_MS = 24;
const HYDRATION_THRESHOLD = 20;

/**
 * Build a map of source -> target node IDs from edges (children = targets of a source).
 */
function buildChildrenMap(
  edges: { source: string; target: string }[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of edges) {
    const children = map.get(edge.source);
    if (children) {
      children.push(edge.target);
    } else {
      map.set(edge.source, [edge.target]);
    }
  }
  return map;
}

/**
 * Collect all descendants of a node recursively, avoiding cycles.
 */
function collectDescendants(
  nodeId: string,
  childrenMap: Map<string, string[]>,
  visited: Set<string> = new Set(),
): string[] {
  const result: string[] = [];
  const children = childrenMap.get(nodeId);
  if (!children) return result;

  for (const childId of children) {
    if (visited.has(childId)) continue;
    visited.add(childId);
    result.push(childId);
    result.push(...collectDescendants(childId, childrenMap, visited));
  }
  return result;
}

export function useCanvasNodes(
  canvasId: Id<"canvases">,
  canvasNodes?: CanvasNode[],
) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const { getEdges, getNodes } = useReactFlow();
  const isCtrlHeld = useKeyHold("Control");
  const closeWindowsForNodeIds = useWindowsStore(
    (state) => state.closeWindowsForNodeIds,
  );

  const lastPositionChangesWhenResizing = useRef<NodePositionChange[] | null>(
    null,
  );

  // Cache: dragged node ID -> descendants + their initial offsets from parent
  const draggedChildrenCache = useRef<{
    draggedNodeId: string | null;
    descendantIds: string[];
    descendantSet: Set<string>;
    // offset = descendant.initialPosition - parent.initialPosition
    initialOffsets: Map<string, { x: number; y: number }>;
  }>({
    draggedNodeId: null,
    descendantIds: [],
    descendantSet: new Set(),
    initialOffsets: new Map(),
  });

  const hydrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrationRunIdRef = useRef(0);

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

  useEffect(() => {
    return () => {
      if (hydrationTimerRef.current !== null) {
        clearTimeout(hydrationTimerRef.current);
        hydrationTimerRef.current = null;
      }
    };
  }, []);

  // Sync convex -> reactflow nodes.
  // Admission is progressive for large diffs to avoid mounting all nodes at once.
  useEffect(() => {
    if (hydrationTimerRef.current !== null) {
      clearTimeout(hydrationTimerRef.current);
      hydrationTimerRef.current = null;
    }

    const runId = ++hydrationRunIdRef.current;

    if (canvasNodes !== undefined) {
      if (canvasNodes.length === 0) {
        setNodes([]);
        return;
      }

      const incomingNodes = fromCanvasNodesToXyNodes(canvasNodes) as Node[];

      const mergeNode = (
        newNode: Node,
        currentNode: Node | undefined,
      ): Node => {
        if (
          currentNode?.dragging ||
          (currentNode as Node | undefined)?.resizing ||
          (draggedChildrenCache.current.draggedNodeId !== null &&
            draggedChildrenCache.current.descendantIds.includes(newNode.id))
        ) {
          return currentNode as Node;
        }

        if (currentNode?.selected) {
          return { ...newNode, selected: true } as Node;
        }

        return newNode as Node;
      };

      setNodes((currentNodes: Node[]) => {
        const currentNodesMap = new Map(currentNodes.map((n) => [n.id, n]));
        const addedNodes = incomingNodes.filter(
          (incomingNode) => !currentNodesMap.has(incomingNode.id),
        );
        const shouldHydrateProgressively =
          addedNodes.length >= HYDRATION_THRESHOLD;

        if (!shouldHydrateProgressively) {
          return incomingNodes.map((incomingNode) =>
            mergeNode(incomingNode, currentNodesMap.get(incomingNode.id)),
          );
        }

        const admittedIds = new Set(
          addedNodes.slice(0, HYDRATION_BATCH_SIZE).map((node) => node.id),
        );

        const scheduleNextBatch = (offset: number) => {
          if (offset >= addedNodes.length) {
            hydrationTimerRef.current = null;
            return;
          }

          hydrationTimerRef.current = setTimeout(() => {
            if (runId !== hydrationRunIdRef.current) {
              hydrationTimerRef.current = null;
              return;
            }

            const nextSlice = addedNodes.slice(
              offset,
              offset + HYDRATION_BATCH_SIZE,
            );
            for (const node of nextSlice) {
              admittedIds.add(node.id);
            }

            setNodes((current) => {
              if (runId !== hydrationRunIdRef.current) {
                return current;
              }

              const currentMap = new Map(current.map((n) => [n.id, n]));
              return incomingNodes
                .filter(
                  (incomingNode) =>
                    currentMap.has(incomingNode.id) ||
                    admittedIds.has(incomingNode.id),
                )
                .map((incomingNode) =>
                  mergeNode(incomingNode, currentMap.get(incomingNode.id)),
                );
            });

            scheduleNextBatch(offset + HYDRATION_BATCH_SIZE);
          }, HYDRATION_GAP_MS);
        };

        scheduleNextBatch(HYDRATION_BATCH_SIZE);

        return incomingNodes
          .filter(
            (incomingNode) =>
              currentNodesMap.has(incomingNode.id) ||
              admittedIds.has(incomingNode.id),
          )
          .map((incomingNode) =>
            mergeNode(incomingNode, currentNodesMap.get(incomingNode.id)),
          );
      });
    }
  }, [canvasNodes, setNodes]);

  const handleNodeChange = useCallback(
    (changes: NodeChange[]) => {
      const positionChanges = changes.filter(
        (change: NodeChange) => change.type === "position",
      ) as NodePositionChange[];

      // Move children along with dragged parent (unless Ctrl is held)
      // Compute delta BEFORE onNodesChange applies the parent's new position
      const isDragging = positionChanges.some((change) => change.dragging);
      let parentNewPosition: { x: number; y: number } | null = null;
      let descendantIds: string[] = [];

      if (isDragging && isCtrlHeld) {
        const draggedChanges = positionChanges.filter(
          (c) => c.dragging && c.position,
        );

        if (draggedChanges.length > 0) {
          const draggedIds = new Set(draggedChanges.map((c) => c.id));

          // Rebuild children cache if the dragged node changed
          const cacheKey = [...draggedIds].sort().join(",");
          if (draggedChildrenCache.current.draggedNodeId !== cacheKey) {
            const edges = getEdges();
            const currentNodes = getNodes();
            const childrenMap = buildChildrenMap(edges);
            const allDescendants = new Set<string>();
            for (const draggedId of draggedIds) {
              for (const desc of collectDescendants(
                draggedId,
                childrenMap,
                new Set(draggedIds),
              )) {
                allDescendants.add(desc);
              }
            }
            for (const id of draggedIds) {
              allDescendants.delete(id);
            }

            // Store initial offsets: descendant position - parent position at drag start
            const firstDraggedNode = currentNodes.find(
              (n) => n.id === draggedChanges[0].id,
            );
            const initialOffsets = new Map<string, { x: number; y: number }>();
            if (firstDraggedNode) {
              const nodesMap = new Map(currentNodes.map((n) => [n.id, n]));
              for (const descId of allDescendants) {
                const descNode = nodesMap.get(descId);
                if (descNode) {
                  initialOffsets.set(descId, {
                    x: descNode.position.x - firstDraggedNode.position.x,
                    y: descNode.position.y - firstDraggedNode.position.y,
                  });
                }
              }
            }

            draggedChildrenCache.current = {
              draggedNodeId: cacheKey,
              descendantIds: [...allDescendants],
              descendantSet: allDescendants,
              initialOffsets,
            };
          }

          descendantIds = draggedChildrenCache.current.descendantIds;

          if (descendantIds.length > 0) {
            const firstChange = draggedChanges[0];
            if (firstChange.position) {
              parentNewPosition = firstChange.position;
            }
          }
        }
      }

      // Apply parent's position change
      onNodesChange(changes);

      // Set absolute positions for descendants based on initial offsets
      if (parentNewPosition && descendantIds.length > 0) {
        const newPos = parentNewPosition;
        const { descendantSet, initialOffsets } = draggedChildrenCache.current;
        setNodes((currentNodes) =>
          currentNodes.map((node) => {
            if (descendantSet.has(node.id)) {
              const offset = initialOffsets.get(node.id);
              if (offset) {
                return {
                  ...node,
                  position: {
                    x: newPos.x + offset.x,
                    y: newPos.y + offset.y,
                  },
                };
              }
            }
            return node;
          }),
        );
      }

      const addedChanges = changes.filter(
        (change: NodeChange) => change.type === "add",
      ) as NodeAddChange[];
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
        closeWindowsForNodeIds(removedChanges.map((change) => change.id));
        // Envoi direct à Convex
        return removeCanvasNodesToConvex({
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
          // throttledUpdatePositions(positionChanges);
        } else {
          // Envoi direct à Convex quand le drag est fini
          // Include descendant position changes when drag ends
          const { descendantIds, descendantSet } = draggedChildrenCache.current;
          if (descendantIds.length > 0) {
            const currentNodes = getNodes();
            const positionChangeIds = new Set(positionChanges.map((c) => c.id));
            const descendantChanges: NodePositionChange[] = currentNodes
              .filter(
                (node) =>
                  descendantSet.has(node.id) && !positionChangeIds.has(node.id),
              )
              .map((node) => ({
                type: "position" as const,
                id: node.id,
                position: node.position,
                dragging: false,
              }));

            draggedChildrenCache.current = {
              draggedNodeId: null,
              descendantIds: [],
              descendantSet: new Set(),
              initialOffsets: new Map(),
            };
            return updateCanvasNodesPositionOrDimensionsInConvex({
              canvasId,
              nodeChanges: [...positionChanges, ...descendantChanges],
            });
          }
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
      closeWindowsForNodeIds,
      removeCanvasNodesToConvex,
      updateCanvasNodesPositionOrDimensionsInConvex,
      // throttledUpdatePositions,
      onNodesChange,
      getEdges,
      getNodes,
      setNodes,
      isCtrlHeld,
    ],
  );

  return {
    nodes,
    setNodes,
    handleNodeChange,
  };
}
