import type { NodeColors } from "./node.types";

export type EdgeStrokeWidth = "thin" | "regular" | "thick";
export type EdgeMarker = "none" | "arrow";

export interface EdgeCustomData {
  label?: string;
  color?: NodeColors;
  strokeWidth?: EdgeStrokeWidth;
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  [key: string]: any;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: EdgeCustomData;
}
