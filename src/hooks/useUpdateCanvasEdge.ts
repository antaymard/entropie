import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { toastError } from "@/components/utils/errorUtils";

interface UpdateEdgeInput {
  edgeId: string;
  data: Record<string, unknown>;
}

export function useUpdateCanvasEdge() {
  const { canvasId }: { canvasId: Id<"canvases"> } = useParams({
    from: "/canvas/$canvasId",
  });

  const { setEdges } = useReactFlow();

  const updateMutation = useMutation(api.canvasEdges.update);

  const updateCanvasEdge = useCallback(
    async ({ edgeId, data }: UpdateEdgeInput) => {
      setEdges((edges) =>
        edges.map((edge) =>
          edge.id === edgeId ? { ...edge, data } : edge,
        ),
      );

      try {
        await updateMutation({
          canvasId,
          edgeUpdates: [{ id: edgeId, data }],
        });
      } catch (error) {
        toastError(error, "Error updating edge");
      }
    },
    [canvasId, setEdges, updateMutation],
  );

  return { updateCanvasEdge };
}
