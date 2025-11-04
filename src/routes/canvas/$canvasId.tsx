import { createFileRoute } from "@tanstack/react-router";
import CanvasTopBar from "../../components/canvas/CanvasTopBar";
import {
  Background,
  ReactFlow,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import nodeTypes from "../../components/nodes/nodeTypes";
import { useCanvasStore } from "../../stores/canvasStore";
import { useCallback, useEffect, useState } from "react";
import ContextMenu from "../../components/canvas/context-menus";

export const Route = createFileRoute("/canvas/$canvasId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { canvasId } = Route.useParams() as { canvasId: Id<"canvases"> };

  // Fetch canvas data
  const canvas = useQuery(api.canvases.getCanvas, {
    canvasId: canvasId,
  });

  const [contextMenu, setContextMenu] = useState<{
    type: "node" | "edge" | "canvas" | null;
    position: { x: number; y: number };
    element: object | null;
  }>({
    type: null,
    position: { x: 0, y: 0 },
    element: null,
  });

  // Zustand store
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const onNodesChange = useCanvasStore((state) => state.onNodesChange);
  const onEdgesChange = useCanvasStore((state) => state.onEdgesChange);
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);

  // Load data from database into store
  useEffect(() => {
    if (canvas?.nodes) setNodes(canvas.nodes as Node[]);
    if (canvas?.edges) setEdges(canvas.edges as Edge[]);
  }, [canvas, setNodes, setEdges]);

  const handleRightClick = useCallback(
    function (
      e: React.MouseEvent | MouseEvent,
      type: "node" | "edge" | "canvas",
      element: object | null
    ) {
      e.preventDefault();
      setContextMenu({
        type,
        position: { x: e.clientX, y: e.clientY },
        element,
      });
    },
    [setContextMenu]
  );

  if (!canvas) {
    return <div>Chargement du canvas...</div>;
  }

  return (
    <div className="h-full w-full">
      <CanvasTopBar canvasName={canvas.name} canvasId={canvasId} />
      <div style={{ height: "calc(100% - 64px)", width: "100%" }}>
        <ReactFlow
          panOnScroll
          selectionOnDrag
          panOnDrag={false}
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onPaneContextMenu={(e) => handleRightClick(e, "canvas", null)}
        >
          <Background />
          <Controls />
          {/* <Panel position="bottom-center">TODO</Panel> */}
        </ReactFlow>
      </div>
      {contextMenu.type && (
        <ContextMenu
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
        />
      )}
    </div>
  );
}
