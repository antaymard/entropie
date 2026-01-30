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
  SelectionMode,
} from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { cn } from "@/lib/utils";
import useRichQuery from "@/components/utils/useRichQuery";
import { useNodeDataStore } from "@/stores/nodeDataStore";
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
  const setNodeDatas = useNodeDataStore((state) => state.setNodeDatas);

  // Fetch canvas
  const {
    isError: isCanvasError,
    data: canvas,
    error: canvasError,
  } = useRichQuery(api.canvases.readCanvas, {
    canvasId,
  });

  // Fetch nodeDatas for this canvas
  const { data: nodeDatas } = useRichQuery(
    api.nodeDatas.listByCanvasId,
    canvasId ? { canvasId } : "skip",
  );

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

  // Sync convex -> reactflow nodes, en préservant les nodes en cours de drag
  // et la sélection
  useEffect(() => {
    if (canvas && canvas.nodes) {
      setNodes((currentNodes) => {
        const newNodes = fromCanvasNodesToXyNodes(canvas.nodes as CanvasNode[]);

        return newNodes.map((newNode) => {
          const currentNode = currentNodes.find((n) => n.id === newNode.id);

          // Si le node est en cours de drag, on garde le currentNode complet
          if (currentNode?.dragging) {
            return currentNode;
          }

          // Sinon, on prend le newNode mais on préserve la sélection
          if (currentNode?.selected) {
            return { ...newNode, selected: true };
          }

          return newNode;
        });
      });
    }
  }, [canvas]);

  // Sync convex nodeDatas -> zustand store
  useEffect(() => {
    if (nodeDatas) {
      setNodeDatas(nodeDatas);
    }
  }, [nodeDatas, setNodeDatas]);

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

  if (!canvas) {
    return <div>Loading canvas...</div>;
  }

  document.title = `${canvas.name}`;

  return (
    <div className="flex-1 w-full h-full">
      <ReactFlow
        panOnScroll
        panOnDrag={[1]}
        defaultViewport={{
          x: 0,
          y: 0,
          zoom: 0,
        }}
        selectNodesOnDrag={false}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={true}
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
