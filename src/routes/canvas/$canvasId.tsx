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
  Panel,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { nodeTypes, nodeList } from "../../components/nodes/nodeTypes";
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
import { debounce, set } from "lodash";
import { toastError } from "@/components/utils/errorUtils";
import WindowsContainer from "@/components/windows/WindowsContainer";
import { useWindowsStore } from "@/stores/windowsStore";
import type { NodeType } from "@/types/node.types";
import WindowsBottomBar from "@/components/windows/bottom-bar/WindowsBottomBar";
import { useTemplateStore } from "@/stores/templateStore";

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

  // Fetch templates
  const userTemplates = useQuery(api.templates.getUserTemplates, {});

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    type: "node" | "edge" | "canvas" | "selection" | null;
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
  const setUserTemplates = useTemplateStore((state) => state.setTemplates);

  // xyFlow states
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const hasInitialized = useRef(false);
  const [saveIncrement, setSaveIncrement] = useState(0); // To trigger save effect

  // ======= Handlers =======

  const handleRightClick = useCallback(function (
    e: React.MouseEvent | MouseEvent,
    type: "node" | "edge" | "canvas" | "selection",
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

  const handleSelectionContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, nodes: Node[]) =>
      handleRightClick(e, "selection", nodes),
    [handleRightClick]
  );

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent | MouseEvent, node: Node) => {
      e.preventDefault();
      // Checker dans nodeList si le node a la propriété doubleClickToOpenWindow à true
      const nodeInfo = nodeList.find((n) => n.type === node.type);
      if (nodeInfo?.disableDoubleClickToOpenWindow) return;

      // Open a window for this node
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
    // Si tous les changes ne sont pas de type select, on incrémente le saveIncrement
    if (!changes.every((change) => change.type === "select")) {
      setSaveIncrement((prev) => prev + 1);
    }
  }

  function handleEdgesChange(changes: EdgeChange<Edge>[]) {
    onEdgesChange(changes);
  }

  // Set templates in store when fetched
  useEffect(() => {
    setUserTemplates(userTemplates || []);
  }, [userTemplates]);

  // Auto-save when nodes or edges change
  useEffect(() => {
    if (!hasInitialized.current) return;
    if (canvasStatus === "saving") return; // Prevent multiple saves
    if (canvasStatus !== "unsynced") setCanvasStatus("unsynced");

    debouncedSave(nodes, edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveIncrement, debouncedSave]);

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

  // Warn before leaving if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (canvasStatus !== "saved") {
        e.preventDefault();
        e.returnValue = ""; // Modern browsers ignore custom messages
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [canvasStatus]);

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
              selectionMode={SelectionMode.Partial}
              nodeTypes={nodeTypes}
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onPaneContextMenu={handlePaneContextMenu}
              onNodeContextMenu={handleNodeContextMenu}
              onSelectionContextMenu={handleSelectionContextMenu}
              onNodeDoubleClick={handleNodeDoubleClick}
              deleteKeyCode={null}
              snapToGrid
              snapGrid={[5, 5]}
            >
              <Background bgColor="#f9fafb" />
              <Controls />
              <Panel position="bottom-center">
                <WindowsBottomBar />
              </Panel>
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
