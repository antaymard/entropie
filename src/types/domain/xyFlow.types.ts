import type { Id } from "@/../convex/_generated/dataModel";
import type { colorsEnum } from "./style.types";

/**
 * Types for XyFlow (React Flow) adapter
 * These types bridge the gap between our Canvas types and React Flow types
 */

export interface FloatingTextCanvasNodeData {
  text: string;
  level: "h1" | "h2" | "h3" | "p";
}

export interface DisplayPropsThatGoInXyData {
  color?: colorsEnum;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
}

export type XyNodeData<T = unknown> = DisplayPropsThatGoInXyData &
  T & { nodeDataId: Id<"nodeDatas"> };
