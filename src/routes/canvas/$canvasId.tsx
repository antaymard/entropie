import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Background,
  ReactFlow,
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
import { useConvexAuth, useMutation, useQuery } from "convex/react";
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
import type { Canvas } from "@/types";
import { debounce } from "lodash";
import { toastError } from "@/components/utils/errorUtils";
import WindowsContainer from "@/components/windows/WindowsContainer";
import { useWindowsStore } from "@/stores/windowsStore";
import type { NodeType } from "@/types/node.types";
import { useTemplateStore } from "@/stores/templateStore";
import { useCanvasContentHistory } from "@/hooks/useCanvasContentHistory";
import TopLeftToolbar from "@/components/canvas/on-canvas-ui/TopLeftToolbar";
import TopRightToolbar from "@/components/canvas/on-canvas-ui/TopRightToolbar";
import { useDeviceType } from "@/hooks/useDeviceType";
import CanvasToolbar from "@/components/canvas/on-canvas-ui/CanvasToolbar";
import Chat from "@/components/ai/Chat";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/canvas/$canvasId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { canvasId } = Route.useParams() as { canvasId: Id<"canvases"> };
  const isAiPanelOpen = useCanvasStore((state) => state.isAiPanelOpen);

  return (
    <ReactFlowProvider>
      <div
        className={cn(
          "h-screen w-screen ",

          isAiPanelOpen ? "grid grid-cols-[1fr_450px]" : "flex"
        )}
      >
        <CanvasContent key={canvasId} canvasId={canvasId} />
        {isAiPanelOpen && <Chat />}
      </div>
    </ReactFlowProvider>
  );
}

function CanvasContent({ canvasId }: { canvasId: Id<"canvases"> }) {
  // ========== Data Fetching ==========
  const { success: canvasSuccess, canvas } =
    useQuery(api.canvases.getCanvas, { canvasId }) || {};
  const {
    success: templatesSuccess,
    templates: userTemplates,
    error: templatesError,
  } = useQuery(api.templates.getUserTemplates, { canvasId }) || {};

  const { isAuthenticated } = useConvexAuth();
  const saveCanvasInConvex = useMutation(api.canvases.updateCanvasContent);

  // ========== Stores ==========
  const setCanvas = useCanvasStore((state) => state.setCanvas);
  const canvasStatus = useCanvasStore((state) => state.status);
  const setCanvasStatus = useCanvasStore((state) => state.setStatus);
  const enableCanvasUndoRedo = useCanvasStore(
    (state) => state.enableCanvasUndoRedo
  );
  const openWindow = useWindowsStore((state) => state.openWindow);
  const setUserTemplates = useTemplateStore((state) => state.setTemplates);
  const deviceType = useDeviceType();

  // ========== React Flow State ==========
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // ========== Local State ==========
  const [contextMenu, setContextMenu] = useState<{
    type: "node" | "edge" | "canvas" | "selection" | null;
    position: { x: number; y: number };
    element: object | null;
  }>({ type: null, position: { x: 0, y: 0 }, element: null });

  const hasInitialized = useRef(false);
  const [saveIncrement, setSaveIncrement] = useState(0);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ========== History Management ==========
  const { recordChange, undo, redo, isUndoRedo } = useCanvasContentHistory(
    nodes,
    edges,
    setNodes,
    setEdges,
    hasInitialized.current
  );

  // ========== Auto-save ==========
  const debouncedSave = useMemo(
    () =>
      debounce((currentNodes: Node[], currentEdges: Edge[]) => {
        try {
          setCanvasStatus("saving");
          saveCanvasInConvex({
            canvasId,
            nodes: toConvexNodes(currentNodes),
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

  // ========== Context Menu Handlers ==========
  const handleRightClick = useCallback(
    (
      e: React.MouseEvent | MouseEvent,
      type: "node" | "edge" | "canvas" | "selection",
      element: object | null
    ) => {
      e.preventDefault();
      if (!isAuthenticated) return;
      setContextMenu({
        type,
        position: { x: e.clientX, y: e.clientY },
        element,
      });
    },
    [isAuthenticated]
  );

  const handlePaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) =>
      isAuthenticated && handleRightClick(e, "canvas", null),
    [handleRightClick, isAuthenticated]
  );

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, node: Node) =>
      isAuthenticated && handleRightClick(e, "node", node),
    [handleRightClick, isAuthenticated]
  );

  const handleSelectionContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, nodes: Node[]) =>
      handleRightClick(e, "selection", nodes),
    [handleRightClick]
  );

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent | MouseEvent, node: Node) => {
      e.preventDefault();
      const nodeInfo = nodeList.find((n) => n.type === node.type);
      if (nodeInfo?.disableDoubleClickToOpenWindow) return;

      openWindow({
        id: node.id,
        type: node.type as NodeType,
        position: { x: 100, y: 100 },
        width: nodeInfo?.window?.initialWidth || 400,
        height: nodeInfo?.window?.initialHeight || 500,
        isMinimized: false,
      });
    },
    [openWindow]
  );

  // ========== Change Handlers ==========
  const shouldSaveChange = useCallback(
    (changes: NodeChange<Node>[] | EdgeChange<Edge>[]) => {
      return !changes.every((change) => change.type === "select");
    },
    []
  );

  function handleNodesChange(changes: NodeChange<Node>[]) {
    if (!isAuthenticated) return;
    onNodesChange(changes);
    if (isUndoRedo.current) return;

    // Track dragging
    const isDragging = changes.some((c) => c.type === "position" && c.dragging);
    const isDragEnd = changes.some(
      (c) => c.type === "position" && !c.dragging && c.position
    );
    if (isDragging) isDraggingRef.current = true;
    else if (isDragEnd) isDraggingRef.current = false;

    // Track resizing
    const isResizing = changes.some((c) => c.type === "dimensions");
    if (isResizing) {
      isResizingRef.current = true;
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        isResizingRef.current = false;
      }, 150);
    }

    // Trigger save
    if (!isDragging && !isResizing && shouldSaveChange(changes)) {
      if (canvasStatus !== "saving" && canvasStatus !== "unsynced")
        setCanvasStatus("unsynced");
      setSaveIncrement((prev) => prev + 1);
    }
  }

  function handleEdgesChange(changes: EdgeChange<Edge>[]) {
    if (!isAuthenticated) return;
    onEdgesChange(changes);
    if (isUndoRedo.current) return;

    if (shouldSaveChange(changes)) {
      if (canvasStatus !== "saving" && canvasStatus !== "unsynced")
        setCanvasStatus("unsynced");
      setSaveIncrement((prev) => prev + 1);
    }
  }

  // ========== Sync Helper ==========
  const syncFromConvex = useCallback(() => {
    // Don't sync if:
    // - No canvas data
    // - Currently dragging or resizing
    // - Have unsaved local changes (would cause rollback)
    if (
      !canvas ||
      isDraggingRef.current ||
      isResizingRef.current ||
      canvasStatus === "unsynced" ||
      canvasStatus === "saving"
    ) {
      return;
    }

    setNodes((currentNodes) => {
      const convexNodes = toXyNodes(canvas.nodes);
      const currentNodeMap = new Map(currentNodes.map((n) => [n.id, n]));
      return convexNodes.map((convexNode) => ({
        ...convexNode,
        selected: currentNodeMap.get(convexNode.id)?.selected ?? false,
      }));
    });

    setEdges((currentEdges) => {
      const convexEdges = canvas.edges || [];
      const currentEdgeMap = new Map(currentEdges.map((e) => [e.id, e]));
      return convexEdges.map((convexEdge) => ({
        ...convexEdge,
        selected: currentEdgeMap.get(convexEdge.id)?.selected ?? false,
      }));
    });

    setCanvas(canvas);
  }, [canvas, setNodes, setEdges, setCanvas, canvasStatus]);

  // ========== Effects ==========

  // Keyboard shortcuts (undo/redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAuthenticated || !enableCanvasUndoRedo) return;
      const key = e.key.toLowerCase();

      if (
        (e.metaKey || e.ctrlKey) &&
        ((key === "z" && e.shiftKey) || key === "y")
      ) {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && key === "z") {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, enableCanvasUndoRedo, isAuthenticated]);

  // Load templates
  useEffect(() => {
    if (templatesSuccess) {
      setUserTemplates(userTemplates || []);
    } else if (templatesSuccess === false) {
      toastError(templatesError, "Erreur lors du chargement des templates");
    }
  }, [templatesSuccess, userTemplates, setUserTemplates, templatesError]);

  // Auto-save
  useEffect(() => {
    if (
      !hasInitialized.current ||
      canvasStatus === "saving" ||
      !isAuthenticated
    )
      return;
    if (canvasStatus !== "unsynced") setCanvasStatus("unsynced");
    debouncedSave(nodes, edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveIncrement, debouncedSave]);

  // Record history
  useEffect(() => {
    if (
      !isAuthenticated ||
      isUndoRedo.current ||
      isDraggingRef.current ||
      isResizingRef.current
    )
      return;
    recordChange(nodes, edges);
  }, [nodes, edges, recordChange, isAuthenticated, isUndoRedo]);

  // Initial load & sync
  useEffect(() => {
    if (!canvasSuccess || !canvas) return;

    if (!hasInitialized.current) {
      setCanvas(canvas);
      setNodes(toXyNodes(canvas.nodes));
      setEdges(canvas.edges || []);
      hasInitialized.current = true;
    } else {
      syncFromConvex();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSuccess, canvas]);

  // Reset on canvas change
  useEffect(() => {
    hasInitialized.current = false;
  }, [canvasId]);

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (canvasStatus !== "saved") {
        e.preventDefault();
        e.returnValue = "";
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

  if (!canvasSuccess || canvas === null) {
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
              {isAuthenticated ? (
                <Link to="/">Retourner à l'accueil</Link>
              ) : (
                <Link to="/signin">Connectez-vous</Link>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  document.title = `${canvas.name}`;

  return (
    <>
      <div className="flex-1 w-full border-r">
        <ReactFlow
          panOnScroll
          panOnDrag={[1]}
          selectNodesOnDrag={false}
          selectionOnDrag={deviceType === "desktop"}
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
          nodesDraggable={isAuthenticated}
          edgesConnectable={isAuthenticated}
          className="rounded-md"
        >
          <Background bgColor="#f9fafb" />
          {/* <Controls /> */}

          <Panel position="center-left">
            <CanvasToolbar />
          </Panel>

          <Panel position="top-left">
            <TopLeftToolbar undo={undo} redo={redo} />
          </Panel>
          <Panel position="top-right">
            <TopRightToolbar />
          </Panel>
        </ReactFlow>
        {contextMenu.type && (
          <ContextMenu
            contextMenu={contextMenu}
            setContextMenu={setContextMenu}
          />
        )}
        <WindowsContainer />
      </div>
    </>
  );
}
