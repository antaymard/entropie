import { createFileRoute } from "@tanstack/react-router";
import {
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  MarkerType,
  Panel,
} from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { cn } from "@/lib/utils";
import useRichQuery from "@/components/utils/useRichQuery";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { useWindowsStore } from "@/stores/windowsStore";
import { useCanvasStore } from "@/stores/canvasStore";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import ContextMenu from "@/components/canvas/context-menus";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useEffect, useMemo, useRef } from "react";
import type { CanvasNode } from "@/types/convex";
import { nodeTypes } from "@/components/nodes/nodeTypes";
import { useCanvasPasteHandler } from "@/hooks/useCanvasPasteHandler";
import WindowPanelsContainer from "@/components/windows/WindowPanelsContainer";
import "@xyflow/react/dist/style.css";
import { useIsMobile } from "@/hooks/use-mobile";
import CanvasSidebar from "@/components/canvas/CanvasSidebar";
import { useCanvasNodes } from "@/hooks/useCanvasNodes";
import { useCanvasEdges } from "@/hooks/useCanvasEdges";
import { Spinner } from "@/components/shadcn/spinner";
import NoleCanvasPanel from "@/components/canvas/NoleCanvasPanel";
import CanvasToolbar from "@/components/canvas/on-canvas-ui/CanvasToolbar";
import TopRightToolbar from "@/components/canvas/on-canvas-ui/TopRightToolbar";

export const Route = createFileRoute("/canvas/$canvasId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { canvasId } = Route.useParams() as { canvasId: Id<"canvases"> };

  return (
    <div className="bg-white">
      <ReactFlowProvider key={canvasId}>
        <CanvasSidebar canvasId={canvasId}>
          <div className={cn("h-screen w-full bg-slate-50")}>
            <CanvasContent canvasId={canvasId} />
          </div>
        </CanvasSidebar>
      </ReactFlowProvider>
    </div>
  );
}

function CanvasContent({ canvasId }: { canvasId: Id<"canvases"> }) {
  const setNodeDatas = useNodeDataStore((state) => state.setNodeDatas);
  const setCanvas = useCanvasStore((state) => state.setCanvas);
  const lastCanvasSnapshotRef = useRef<string | null>(null);

  // Cleanup stores on canvas switch
  useEffect(() => {
    useWindowsStore.getState().closeAllWindows();
    useCanvasStore.getState().setStatus("idle");
    setCanvas(null);
    lastCanvasSnapshotRef.current = null;
  }, [canvasId, setCanvas]);

  // Handle paste events (images, URLs)
  useCanvasPasteHandler();

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

  // Context menu management
  const {
    contextMenu,
    setContextMenu,
    onPaneContextMenu,
    onNodeContextMenu,
    onSelectionContextMenu,
    onEdgeContextMenu,
  } = useContextMenu();

  const isMobile = useIsMobile();

  // Canvas nodes management
  const { nodes, handleNodeChange } = useCanvasNodes(
    canvasId,
    canvas?.nodes as CanvasNode[] | undefined,
  );

  // Canvas edges management
  const { edges, handleEdgeChange } = useCanvasEdges(canvasId, canvas?.edges);

  // ======= Put canvas in store, if it changes (besides nodes and edges)
  // Keep only non-flow fields in canvas store (no nodes/edges)
  const canvasForStore = useMemo(() => {
    if (!canvas) {
      return null;
    }

    const canvasWithoutFlowData = { ...canvas };
    delete canvasWithoutFlowData.nodes;
    delete canvasWithoutFlowData.edges;

    return canvasWithoutFlowData;
  }, [canvas]);
  // Sync convex canvas -> zustand canvas store without pointless store updates
  useEffect(() => {
    if (!canvasForStore) {
      return;
    }

    const nextSnapshot = JSON.stringify(canvasForStore);
    if (lastCanvasSnapshotRef.current === nextSnapshot) {
      return;
    }

    lastCanvasSnapshotRef.current = nextSnapshot;
    setCanvas(canvasForStore);
  }, [canvasForStore, setCanvas]);
  // ======

  // Sync convex nodeDatas -> zustand store
  useEffect(() => {
    if (nodeDatas) {
      setNodeDatas(nodeDatas);
    }
  }, [nodeDatas, setNodeDatas]);

  // Sync document title
  useEffect(() => {
    if (canvas?.name) {
      document.title = canvas.name;
    }
  }, [canvas?.name]);

  if (isCanvasError && canvasError) {
    return <ErrorDisplay error={canvasError} />;
  }

  if (!canvas) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full">
      <WindowPanelsContainer />
      <ReactFlow
        panOnScroll
        panOnDrag={isMobile ? true : [1]}
        defaultViewport={{
          x: 0,
          y: 0,
          zoom: 1,
        }}
        selectNodesOnDrag={false}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={!isMobile}
        nodeTypes={nodeTypes}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onSelectionContextMenu={onSelectionContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        deleteKeyCode={null}
        nodes={nodes}
        edges={edges}
        onEdgesChange={handleEdgeChange}
        onNodesChange={handleNodeChange}
        // edgesReconnectable={true}
        onConnect={(params) => {
          handleEdgeChange([
            {
              type: "add" as const,
              item: {
                id: crypto.randomUUID(),
                source: params.source,
                target: params.target,
                sourceHandle: params.sourceHandle ?? undefined,
                targetHandle: params.targetHandle ?? undefined,
                markerEnd: {
                  type: MarkerType.Arrow,
                  width: 30,
                  height: 30,
                  strokeWidth: 1,
                },
              },
            },
          ]);
        }}
      >
        <Panel position="top-right">
          <TopRightToolbar />
        </Panel>
        <Panel position="center-left">
          <CanvasToolbar canvasId={canvasId} />
        </Panel>
        <Panel position="top-center">
          <NoleCanvasPanel />
        </Panel>
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
