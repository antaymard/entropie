import type { Id } from "@/../convex/_generated/dataModel";
import type { colorsEnum } from "./style.types";

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

export type XyNodeData<T = Record<string, never>> = DisplayPropsThatGoInXyData &
  T & { nodeDataId: Id<"nodeDatas"> };
