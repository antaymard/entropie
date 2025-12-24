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
  addEdge,
  type Connection,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { nodeTypes, nodeList } from "../../components/nodes/nodeTypes";
import { edgeTypes } from "../../components/edges/edgeTypes";
import { useCanvasStore } from "../../stores/canvasStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContextMenu from "../../components/canvas/context-menus";
import {
  toConvexEdges,
  toConvexNodes,
  toXyNodes,
} from "../../components/utils/nodeUtils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
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
import { cn } from "@/lib/utils";
import { useNoleStore } from "@/stores/noleStore";
import { NoleChat } from "@/components/ai/NoleChat";

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
        {isAiPanelOpen && <NoleChat />}
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
  const saveCanvas = useMutation(api.canvases.updateCanvasContent);

  // ========== Stores ==========
  const setCanvas = useCanvasStore((state) => state.setCanvas);
  const setCanvasStatus = useCanvasStore((state) => state.setStatus);
  const resetNoleContext = useNoleStore((state) => state.resetAttachments);
  const addAttachments = useNoleStore((state) => state.addAttachments);
  const enableCanvasUndoRedo = useCanvasStore(
    (state) => state.enableCanvasUndoRedo
  );
  const openWindow = useWindowsStore((state) => state.openWindow);
  const setUserTemplates = useTemplateStore((state) => state.setTemplates);
  const deviceType = useDeviceType();

  // ========== React Flow State ===========
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Compteur de changements réels (non select)
  const [contentChangeCount, setContentChangeCount] = useState(0);

  // ========== Local State ==========
  const [contextMenu, setContextMenu] = useState<{
    type: "node" | "edge" | "canvas" | "selection" | null;
    position: { x: number; y: number };
    element: object | null;
  }>({ type: null, position: { x: 0, y: 0 }, element: null });

  // Load initial une seule fois par canvas
  const loadedCanvasIdRef = useRef<string | null>(null);

  // Ignore les updates Convex pendant un délai après des changements locaux
  const lastLocalChangeTimeRef = useRef<number>(0);
  const SYNC_IGNORE_DELAY = 3000; // 3 secondes

  // ========== History Management ==========
  const { recordChange, undo, redo, isUndoRedo } = useCanvasContentHistory(
    nodes,
    edges,
    setNodes,
    setEdges,
    loadedCanvasIdRef.current === canvasId
  );

  // ========== Auto-save avec debounce ==========
  const debouncedSave = useMemo(
    () =>
      debounce((n: Node[], e: Edge[]) => {
        if (!isAuthenticated) return;
        setCanvasStatus("saving");
        saveCanvas({
          canvasId,
          nodes: toConvexNodes(n),
          edges: toConvexEdges(e),
        })
          .then(() => setCanvasStatus("saved"))
          .catch(() => setCanvasStatus("error"));
      }, 1000),
    [canvasId, saveCanvas, isAuthenticated, setCanvasStatus]
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
  const handleEdgeContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, edge: Edge) =>
      isAuthenticated && handleRightClick(e, "edge", edge),
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

  const handleEdgeDoubleClick = useCallback(
    (e: React.MouseEvent | MouseEvent, edge: Edge) => {
      e.preventDefault();
      if (!isAuthenticated) return;

      // Trigger edit mode in the CustomEdge component via data update
      setEdges((eds) =>
        eds.map((ed) =>
          ed.id === edge.id
            ? { ...ed, data: { ...ed.data, _editMode: true } }
            : ed
        )
      );
    },
    [isAuthenticated, setEdges]
  );

  // ========== Change Handlers ==========

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      if (!isAuthenticated) return;
      onNodesChange(changes);
      // Si au moins un change n'est pas de type 'select', incrémente le compteur
      if (changes.some((c) => c.type !== "select")) {
        setContentChangeCount((c) => c + 1);
      }
    },
    [onNodesChange, isAuthenticated]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      if (!isAuthenticated) return;
      onEdgesChange(changes);
      if (changes.some((c) => c.type !== "select")) {
        setContentChangeCount((c) => c + 1);
      }
    },
    [onEdgesChange, isAuthenticated]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!isAuthenticated) return;
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges, isAuthenticated]
  );

  // ========== Effects ==========

  // 1️⃣ Load initial (une seule fois par canvas)
  useEffect(() => {
    if (canvas && loadedCanvasIdRef.current !== canvas._id) {
      setCanvas(canvas);
      resetNoleContext(canvas);
      setNodes(toXyNodes(canvas.nodes));
      setEdges(canvas.edges || []);
      loadedCanvasIdRef.current = canvas._id;
    }
  }, [canvas, setNodes, setEdges, setCanvas]);

  // 2️⃣ Auto-save avec debounce (uniquement si contentChangeCount change)
  useEffect(() => {
    if (loadedCanvasIdRef.current === canvasId) {
      // Marque le moment du changement local pour ignorer les updates Convex
      lastLocalChangeTimeRef.current = Date.now();
      setCanvasStatus("unsynced");
      debouncedSave(nodes, edges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentChangeCount]);

  // 3️⃣ Record history
  useEffect(() => {
    if (!isAuthenticated || isUndoRedo.current) return;
    recordChange(nodes, edges);
  }, [nodes, edges, recordChange, isAuthenticated, isUndoRedo]);

  // 4️⃣ Sync depuis Convex si les données viennent d'ailleurs (ex: IA)
  useEffect(() => {
    if (!canvas || loadedCanvasIdRef.current !== canvas._id) return;

    // Ignore les updates qui arrivent juste après un changement local
    // (ce sont probablement nos propres changements qui reviennent)
    const timeSinceLastChange = Date.now() - lastLocalChangeTimeRef.current;
    if (timeSinceLastChange < SYNC_IGNORE_DELAY) return;

    // Les données viennent d'ailleurs → sync
    setNodes((currentNodes) => {
      const convexNodes = toXyNodes(canvas.nodes);
      return convexNodes.map((convexNode) => ({
        ...convexNode,
        selected:
          currentNodes.find((n) => n.id === convexNode.id)?.selected ?? false,
      }));
    });

    setEdges((currentEdges) => {
      const convexEdges = canvas.edges || [];
      return convexEdges.map((convexEdge) => ({
        ...convexEdge,
        selected:
          currentEdges.find((e) => e.id === convexEdge.id)?.selected ?? false,
      }));
    });
  }, [canvas, setNodes, setEdges]);

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
          defaultViewport={{
            x: 0,
            y: 0,
            zoom: 0,
          }}
          selectNodesOnDrag={false}
          selectionOnDrag={deviceType === "desktop"}
          selectionMode={SelectionMode.Partial}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodes={nodes}
          connectionMode={ConnectionMode.Loose}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onPaneContextMenu={handlePaneContextMenu}
          onPaneClick={(e: React.MouseEvent) => {
            if (e.altKey) {
              addAttachments(
                { position: { x: e.clientX, y: e.clientY } },
                true
              );
            }
          }}
          onNodeContextMenu={handleNodeContextMenu}
          onEdgeContextMenu={handleEdgeContextMenu}
          onSelectionContextMenu={handleSelectionContextMenu}
          onNodeDoubleClick={handleNodeDoubleClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          deleteKeyCode={null}
          // snapToGrid
          // snapGrid={[5, 5]}
          nodesDraggable={isAuthenticated}
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
