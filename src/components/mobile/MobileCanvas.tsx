import { useEffect, useMemo, useRef, useState } from "react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import useRichQuery from "@/components/utils/useRichQuery";
import { fromCanvasNodesToXyNodes } from "@/lib/node-types-converter";
import type { CanvasNode } from "@/types";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useWindowsStore } from "@/stores/windowsStore";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import { Spinner } from "@/components/shadcn/spinner";
import MobileChatScreen from "./MobileChatScreen";
import MobileChatInput from "./MobileChatInput";
import MobileLeftSidebar from "./MobileLeftSidebar";
import MobileSearchSidebar from "./MobileSearchSidebar";
import MobileNodeOverlay from "./MobileNodeOverlay";
import { MobileNoleProvider } from "./MobileNoleContext";

export default function MobileCanvas({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  return (
    <ReactFlowProvider key={canvasId}>
      <MobileCanvasContent canvasId={canvasId} />
    </ReactFlowProvider>
  );
}

function MobileCanvasContent({ canvasId }: { canvasId: Id<"canvases"> }) {
  const setNodeDatas = useNodeDataStore((state) => state.setNodeDatas);
  const clearNodeDatas = useNodeDataStore((state) => state.clear);
  const setCanvas = useCanvasStore((state) => state.setCanvas);
  const lastCanvasSnapshotRef = useRef<string | null>(null);

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [searchSidebarOpen, setSearchSidebarOpen] = useState(false);

  const { setNodes, setEdges } = useReactFlow();

  useEffect(() => {
    useWindowsStore.getState().closeAllWindows();
    useCanvasStore.getState().setStatus("idle");
    setCanvas(null);
    clearNodeDatas();
    lastCanvasSnapshotRef.current = null;
  }, [canvasId, clearNodeDatas, setCanvas]);

  const {
    isError: isCanvasError,
    data: canvas,
    error: canvasError,
  } = useRichQuery(api.canvases.readCanvas, { canvasId });

  const {
    isError: isNodeDatasError,
    data: nodeDatas,
    error: nodeDatasError,
  } = useRichQuery(
    api.nodeDatas.listByCanvasId,
    canvasId ? { canvasId } : "skip",
  );

  // Inject canvas nodes/edges into the (off-screen) react-flow store so that
  // hooks like `useNodes`, `useStore` keep working even though we don't render.
  // We must convert Convex CanvasNode -> xy-flow Node (notably to expose
  // `data.nodeDataId`, which mention cards read from).
  useEffect(() => {
    const xyNodes = canvas?.nodes
      ? fromCanvasNodesToXyNodes(canvas.nodes as CanvasNode[])
      : [];
    setNodes(xyNodes);
    setEdges((canvas?.edges ?? []) as Parameters<typeof setEdges>[0]);
  }, [canvas?.nodes, canvas?.edges, setNodes, setEdges]);

  const canvasForStore = useMemo(() => {
    if (!canvas) return null;
    const next = { ...canvas };
    delete next.nodes;
    delete next.edges;
    return next;
  }, [canvas]);

  useEffect(() => {
    if (!canvasForStore) return;
    const nextSnapshot = JSON.stringify(canvasForStore);
    if (lastCanvasSnapshotRef.current === nextSnapshot) return;
    lastCanvasSnapshotRef.current = nextSnapshot;
    setCanvas(canvasForStore);
  }, [canvasForStore, setCanvas]);

  useEffect(() => {
    if (nodeDatas) setNodeDatas(nodeDatas);
  }, [nodeDatas, setNodeDatas]);

  useEffect(() => {
    if (isNodeDatasError) clearNodeDatas();
  }, [clearNodeDatas, isNodeDatasError]);

  useEffect(() => {
    if (canvas?.name) document.title = canvas.name;
  }, [canvas?.name]);

  if (isCanvasError && canvasError) {
    return <ErrorDisplay error={canvasError} />;
  }
  if (isNodeDatasError && nodeDatasError) {
    return <ErrorDisplay error={nodeDatasError} />;
  }
  if (!canvas) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <MobileNoleProvider>
      <div className="h-dvh w-screen overflow-hidden bg-white">
        <MobileChatScreen
          canvasName={canvas.name}
          onOpenLeft={() => setLeftSidebarOpen(true)}
          onOpenSearch={() => setSearchSidebarOpen(true)}
        />
        <MobileNodeOverlay />
        <MobileChatInput />
        <MobileLeftSidebar
          canvasId={canvasId}
          open={leftSidebarOpen}
          onOpenChange={setLeftSidebarOpen}
        />
        <MobileSearchSidebar
          canvasId={canvasId}
          open={searchSidebarOpen}
          onOpenChange={setSearchSidebarOpen}
        />
      </div>
    </MobileNoleProvider>
  );
}
