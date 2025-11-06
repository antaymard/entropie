import { createFileRoute, Link } from "@tanstack/react-router";
import CanvasTopBar from "../../components/canvas/CanvasTopBar";
import {
  Background,
  ReactFlow,
  Controls,
  type Edge,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import nodeTypes from "../../components/nodes/nodeTypes";
import { useCanvasStore } from "../../stores/canvasStore";
import { useCallback, useEffect, useState } from "react";
import ContextMenu from "../../components/canvas/context-menus";
import type { CanvasNode } from "../../types/node.types";
import { toReactFlowNode } from "../../components/utils/nodeUtils";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  // Define handleRightClick before any early returns
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

  // Load data from database into store
  useEffect(() => {
    if (canvas?.nodes) {
      const reactFlowNodes = canvas.nodes.map(toReactFlowNode);
      setNodes(reactFlowNodes as CanvasNode[]);
    }
    if (canvas?.edges) setEdges(canvas.edges as Edge[]);
  }, [canvas, setNodes, setEdges]);

  // Handle loading and error states
  if (canvas === undefined) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (canvas === null) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Espace non trouvé</CardTitle>
          </CardHeader>
          <CardContent>
            Vous n'avez pas accès à cet espace ou il n'existe pas.
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/">Retourner à l'accueil</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50">
      <ReactFlowProvider>
        <CanvasTopBar canvasName={canvas?.name} canvasId={canvasId} />
        <div style={{ height: "calc(100% - 64px)", width: "100%" }}>
          <ReactFlow
            panOnScroll
            selectionOnDrag
            panOnDrag={[1]}
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onPaneContextMenu={(e) => handleRightClick(e, "canvas", null)}
          >
            <Background bgColor="#f9fafb" />
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
      </ReactFlowProvider>
    </div>
  );
}
