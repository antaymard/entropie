import { createFileRoute } from "@tanstack/react-router";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodes,
  useNodesState,
  useReactFlow,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { cn } from "@/lib/utils";
import useRichQuery from "@/components/utils/useRichQuery";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import ContextMenu from "@/components/canvas/context-menus";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useCallback } from "react";
import { useMutation } from "convex/react";
import { fromXyNodesToCanvasNodes } from "@/lib/node-types-converter";

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

  const { contextMenu, setContextMenu, onPaneContextMenu } = useContextMenu();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  const handleNodeChange = useCallback((changes: NodeChange[]) => {
    console.log("Node changes:", changes);
    onNodesChange(changes);

    const addedChanges = changes
      .filter((change: NodeChange) => change.type === "add")
      .map((change) => change.item as Node) as Node[];
    const positionOrDimensionChanges = changes.filter(
      (change: NodeChange) =>
        change.type === "position" || change.type === "dimensions",
    );

    if (addedChanges.length > 0) {
      console.log("Nodes added:", addedChanges);
      // Envoi direct à Convex
      addCanvasNodesToConvex({
        canvasNodes: fromXyNodesToCanvasNodes(addedChanges),
        canvasId,
      });
    }
    if (positionOrDimensionChanges.length > 0) {
      console.log(
        "Nodes position or dimensions changed:",
        positionOrDimensionChanges,
      );
      // Envoi debounced à Convex
    }
  }, []);

  if (isCanvasError && canvasError) {
    return <ErrorDisplay error={canvasError} />;
  }

  console.log(nodes);

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
