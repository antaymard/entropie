import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { memo } from "react";
import nodeColors from "../nodes/nodeColors";
import type { EdgeCustomData } from "@/types/edge.types";

const strokeWidthMap = {
  thin: 1,
  regular: 2,
  thick: 4,
};

const CustomEdge = memo(function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  data,
}: EdgeProps) {
  const customData = data as EdgeCustomData | undefined;

  // Get edge customization from data
  const color = customData?.color || "default";
  const strokeWidth = strokeWidthMap[customData?.strokeWidth || "regular"];
  const label = customData?.label;
  const customMarkerStart = customData?.markerStart || "none";
  const customMarkerEnd = customData?.markerEnd || "none";

  // Get color from nodeColors
  const colorConfig = nodeColors[color];
  const strokeColor = colorConfig?.plain.replace("bg-", "");

  // Convert Tailwind color to CSS
  const getCSSColor = (tailwindClass: string): string => {
    if (tailwindClass.startsWith("[") && tailwindClass.endsWith("]")) {
      return tailwindClass.slice(1, -1);
    }
    // Default colors mapping
    const colorMap: Record<string, string> = {
      "slate-600": "#475569",
      "red-600": "#dc2626",
      "orange-600": "#ea580c",
      "yellow-600": "#ca8a04",
      "green-600": "#16a34a",
      "blue-600": "#2563eb",
      "purple-600": "#9333ea",
      "pink-600": "#db2777",
    };
    return colorMap[strokeColor] || "#475569";
  };

  const edgeColor = getCSSColor(strokeColor);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Create unique marker IDs
  const markerStartId =
    customMarkerStart === "arrow" ? `marker-start-${id}` : undefined;
  const markerEndId =
    customMarkerEnd === "arrow" ? `marker-end-${id}` : undefined;

  return (
    <>
      <defs>
        {customMarkerStart === "arrow" && (
          <marker
            id={markerStartId}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path
              d="M 10 5 L 0 0 L 0 10 z"
              fill={edgeColor}
              strokeWidth={0}
            />
          </marker>
        )}
        {customMarkerEnd === "arrow" && (
          <marker
            id={markerEndId}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth={6}
            markerHeight={6}
            orient="auto"
          >
            <path
              d="M 0 5 L 10 0 L 10 10 z"
              fill={edgeColor}
              strokeWidth={0}
            />
          </marker>
        )}
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth,
        }}
        markerStart={markerStartId ? `url(#${markerStartId})` : undefined}
        markerEnd={markerEndId ? `url(#${markerEndId})` : undefined}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan px-2 py-1 bg-white border border-gray-300 rounded text-xs shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export default CustomEdge;
