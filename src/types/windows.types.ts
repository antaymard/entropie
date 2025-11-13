import type { NodeType } from "./node.types";

export interface Window {
  id: string; // Node Id (not _id)
  type: NodeType;
  position: { x: number; y: number };
  width: number;
  height: number;
  isMinimized: boolean;
  isExpanded?: boolean;
}

export type ResizeDirection =
  | "tl"
  | "tc"
  | "tr"
  | "ml"
  | "mr"
  | "bl"
  | "bc"
  | "br";
