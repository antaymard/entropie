import { createFileRoute } from "@tanstack/react-router";
import CanvasTopBar from "../../components/canvas/CanvasTopBar";
import { Background, ReactFlow, Controls, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";

export const Route = createFileRoute("/canvas/$canvasId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { canvasId } = Route.useParams();
  const canvas = useQuery(api.canvases.getCanvas, {
    canvasId: canvasId as Id<"canvases">,
  });
  const updateCanvas = useMutation(api.canvases.updateCanvas);

  const handleRename = async (newName: string) => {
    await updateCanvas({
      canvasId: canvasId as Id<"canvases">,
      name: newName,
    });
  };

  if (!canvas) {
    return <div>Chargement du canvas...</div>;
  }

  return (
    <div className="h-full w-full">
      <CanvasTopBar canvasName={canvas.name} onRename={handleRename} />
      <div style={{ height: "calc(100% - 64px)", width: "100%" }}>
        <ReactFlow panOnScroll selectionOnDrag panOnDrag={false}>
          <Background />
          <Controls />
          <Panel position="bottom-center">TODO</Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
