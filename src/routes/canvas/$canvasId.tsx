import { createFileRoute } from "@tanstack/react-router";
import {
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  MarkerType,
} from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { cn } from "@/lib/utils";
import useRichQuery from "@/components/utils/useRichQuery";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import ContextMenu from "@/components/canvas/context-menus";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useEffect } from "react";
import type { CanvasNode } from "@/types";
import { nodeTypes } from "@/components/nodes/nodeTypes";
import { useCanvasPasteHandler } from "@/hooks/useCanvasPasteHandler";
import WindowPanelsContainer from "@/components/windows/WindowPanelsContainer";
import "@xyflow/react/dist/style.css";
import { useIsMobile } from "@/hooks/use-mobile";
import CanvasSidebar from "@/components/canvas/CanvasSidebar";
import { useCanvasNodes } from "@/hooks/useCanvasNodes";
import { useCanvasEdges } from "@/hooks/useCanvasEdges";
import type { Canvas } from "@/types";

export const Route = createFileRoute("/canvas/$canvasId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { canvasId } = Route.useParams() as { canvasId: Id<"canvases"> };

  return (
    <div className="bg-white">
      <ReactFlowProvider>
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

  // Sync convex nodeDatas -> zustand store
  useEffect(() => {
    if (nodeDatas) {
      setNodeDatas(nodeDatas);
    }
  }, [nodeDatas, setNodeDatas]);

  if (isCanvasError && canvasError) {
    return <ErrorDisplay error={canvasError} />;
  }

  if (!canvas) {
    return <div>Loading canvas...</div>;
  }

  document.title = `${canvas.name}`;

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
          nodes={nodes}
          edges={edges}
          onEdgesChange={handleEdgeChange}
          onNodesChange={handleNodeChange}
          // edgesReconnectable={true}
          onConnectStart={console.log}
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
          onConnectEnd={console.log}
          // onReconnectStart={console.log}
          // onReconnect={console.log}
          // onReconnectEnd={console.log}
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
