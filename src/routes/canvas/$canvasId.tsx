import { createFileRoute } from "@tanstack/react-router";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Node,
  type NodeAddChange,
  type NodeChange,
  type NodeDimensionChange,
  type NodePositionChange,
  type NodeRemoveChange,
} from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { cn } from "@/lib/utils";
import useRichQuery from "@/components/utils/useRichQuery";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import ContextMenu from "@/components/canvas/context-menus";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useCallback, useEffect, useMemo } from "react";
import { throttle } from "lodash";
import { useMutation } from "convex/react";
import {
  fromCanvasNodesToXyNodes,
  fromXyNodesToCanvasNodes,
} from "@/lib/node-types-converter";
import type { CanvasNode } from "@/types";
import { nodeTypes } from "@/components/nodes/nodeTypes";

export const Route = createFileRoute("/canvas/$canvasId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { canvasId } = Route.useParams() as { canvasId: Id<"canvases"> };

  return (
    <ReactFlowProvider>
      <div className={cn("h-screen w-screen bg-slate-50")}>
        <CanvasContent canvasId={canvasId} />
      </div>
    </ReactFlowProvider>
  );
}

function CanvasContent({ canvasId }: { canvasId: Id<"canvases"> }) {
  const {
    isError: isCanvasError,
    data: canvas,
    error: canvasError,
  } = useRichQuery(api.canvases.readCanvas, {
    canvasId,
  });

  const addCanvasNodesToConvex = useMutation(api.canvasNodes.add);
  const updateCanvasNodesPositionOrDimensionsInConvex = useMutation(
    api.canvasNodes.updatePositionOrDimensions,
  );
  const removeCanvasNodesToConvex = useMutation(api.canvasNodes.remove);

  const { contextMenu, setContextMenu, onPaneContextMenu } = useContextMenu();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

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

  useEffect(() => {
    if (canvas && canvas.nodes) {
      setNodes((currentNodes) => {
        // Identifier les nodes en cours de drag
        const draggingIds = new Set(
          currentNodes.filter((n) => n.dragging).map((n) => n.id),
        );

        const newNodes = fromCanvasNodesToXyNodes(canvas.nodes as CanvasNode[]);

        return newNodes.map((newNode) => {
          if (draggingIds.has(newNode.id)) {
            const currentNode = currentNodes.find((n) => n.id === newNode.id);
            return currentNode ?? newNode;
          }
          return newNode;
        });
      });
    }
  }, [canvas]);

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
        addCanvasNodesToConvex({
          canvasNodes: fromXyNodesToCanvasNodes(
            addedChanges.map((c) => c.item) as Node[],
          ),
          canvasId,
        });
      }
      // UPDATE NODES POSITIONS
      if (positionChanges.length > 0) {
        if (positionChanges.some((change) => change.dragging)) {
          // Throttle l'envoi à Convex pendant le drag (toutes les 300ms)
          throttledUpdatePositions(positionChanges);
        } else {
          // Envoi direct à Convex quand le drag est fini
          updateCanvasNodesPositionOrDimensionsInConvex({
            canvasId,
            nodeChanges: positionChanges,
          });
        }
      }
      // UPDATE NODES DIMENSIONS
      if (dimensionChanges.length > 0) {
        // Envoyer seulement quand le resize est terminé
        const finishedResizing = dimensionChanges.filter((c) => !c.resizing);
        if (finishedResizing.length > 0) {
          updateCanvasNodesPositionOrDimensionsInConvex({
            canvasId,
            nodeChanges: finishedResizing,
          });
        }
      }
      // REMOVE NODES
      if (removedChanges.length > 0) {
        // Envoi direct à Convex
        removeCanvasNodesToConvex({
          nodeCanvasIds: removedChanges.map((c) => c.id),
          canvasId,
        });
      }
    },
    [
      onNodesChange,
      addCanvasNodesToConvex,
      updateCanvasNodesPositionOrDimensionsInConvex,
      removeCanvasNodesToConvex,
      throttledUpdatePositions,
      canvasId,
    ],
  );

  if (isCanvasError && canvasError) {
    return <ErrorDisplay error={canvasError} />;
  }

  return (
    <div className="flex-1 w-full h-full">
      <ReactFlow
        selectNodesOnDrag={false}
        panOnScroll
        panOnDrag={[1]}
        defaultViewport={{
          x: 0,
          y: 0,
          zoom: 0,
        }}
        nodeTypes={nodeTypes}
        onPaneContextMenu={onPaneContextMenu}
        nodes={nodes}
        onNodesChange={handleNodeChange}
      >
        {contextMenu.type && (
          <ContextMenu
            contextMenu={contextMenu}
            setContextMenu={setContextMenu}
          />
        )}
      </ReactFlow>
    </div>
  );
}
