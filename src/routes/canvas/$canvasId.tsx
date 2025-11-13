import { createFileRoute, Link } from "@tanstack/react-router";
import CanvasTopBar from "../../components/canvas/CanvasTopBar";
import {
  Background,
  ReactFlow,
  Controls,
  type Edge,
  ReactFlowProvider,
  type Node,
  useNodesState,
  useEdgesState,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import nodeTypes from "../../components/nodes/nodeTypes";
import { useCanvasStore } from "../../stores/canvasStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContextMenu from "../../components/canvas/context-menus";
import { toConvexNodes, toXyNodes } from "../../components/utils/nodeUtils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { SidebarProvider } from "@/components/shadcn/sidebar";
import CanvasSidebar from "@/components/canvas/CanvasSidebar";
import type { Canvas } from "@/types";
import { debounce } from "lodash";
import { toastError } from "@/components/utils/errorUtils";
import toast from "react-hot-toast";
import WindowsContainer from "@/components/windows/WindowsContainer";
import { useWindowsStore } from "@/stores/windowsStore";
import type { NodeType } from "@/types/node.types";

export const Route = createFileRoute("/canvas/$canvasId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { canvasId } = Route.useParams() as { canvasId: Id<"canvases"> };

  // Fetch canvas data
  const canvas = useQuery(api.canvases.getCanvas, {
    canvasId: canvasId,
  }) as Canvas | null | undefined;

  const saveCanvasInConvex = useMutation(api.canvases.updateCanvasContent);

  // Context menu state
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
  const setCanvas = useCanvasStore((state) => state.setCanvas);
  const canvasStatus = useCanvasStore((state) => state.status);
  const setCanvasStatus = useCanvasStore((state) => state.setStatus);
  const openWindow = useWindowsStore((state) => state.openWindow);

  // xyFlow states
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const hasInitialized = useRef(false);

  const handleRightClick = useCallback(function (
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
  }, []);

  const handlePaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => handleRightClick(e, "canvas", null),
    [handleRightClick]
  );

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, node: Node) =>
      handleRightClick(e, "node", node),
    [handleRightClick]
  );

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent | MouseEvent, node: Node) => {
      openWindow({
        id: node.id,
        type: node.type as NodeType,
        position: { x: 100, y: 100 },
        width: 400,
        height: 300,
        isMinimized: false,
      });
    },
    [openWindow]
  );

  const debouncedSave = useMemo(
    () =>
      debounce((currentNodes: Node[], currentEdges: Edge[]) => {
        try {
          setCanvasStatus("saving");
          saveCanvasInConvex({
            canvasId,
            nodes: toConvexNodes(currentNodes), // Retransform en format base
            edges: currentEdges,
          });
          setCanvasStatus("saved");
        } catch (error) {
          toastError(error, "Erreur lors de la sauvegarde de l'espace");
          setCanvasStatus("error");
        }
      }, 1000),
    [canvasId, saveCanvasInConvex]
  );

  function handleNodesChange(changes: NodeChange<Node>[]) {
    onNodesChange(changes);
  }

  function handleEdgesChange(changes: EdgeChange<Edge>[]) {
    onEdgesChange(changes);
  }

  // Auto-save when nodes or edges change
  useEffect(() => {
    if (!hasInitialized.current) return;
    if (canvasStatus === "saving") return; // Prevent multiple saves
    if (canvasStatus !== "unsynced") setCanvasStatus("unsynced");

    debouncedSave(nodes, edges);
  }, [nodes, edges, debouncedSave]);

  // Load data from database into store
  useEffect(() => {
    if (canvas && !hasInitialized.current) {
      setCanvas(canvas);
      setNodes(toXyNodes(canvas.nodes));
      setEdges(canvas.edges || []);
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);
  useEffect(() => {
    hasInitialized.current = false;
  }, [canvasId]);

  // ======= Render =======

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
    <SidebarProvider defaultOpen={false}>
      <div className="h-screen w-screen bg-gray-50 flex flex-col">
        <CanvasSidebar currentCanvasId={canvasId} />
        <ReactFlowProvider>
          <CanvasTopBar />
          <div className="flex-1 w-full">
            <ReactFlow
              panOnScroll
              panOnDrag={[1]}
              selectNodesOnDrag={false}
              selectionOnDrag
              nodeTypes={nodeTypes}
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onPaneContextMenu={handlePaneContextMenu}
              onNodeContextMenu={handleNodeContextMenu}
              onNodeDoubleClick={handleNodeDoubleClick}
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
          <WindowsContainer />
        </ReactFlowProvider>
      </div>
    </SidebarProvider>
  );
}
