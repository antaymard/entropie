import type { Id } from "@/../convex/_generated/dataModel";
import type { nodeTypes } from "./nodeData.types";

export interface Window {
  nodeId: string; // Node Id (not _id)
  nodeDataId?: Id<"nodeDatas">
  type: nodeTypes;
  isMinimized?: boolean;
  isExpanded?: boolean;
}

// TO REMOVE
export type ResizeDirection =
  | "tl"
  | "tc"
  | "tr"
  | "ml"
  | "mr"
  | "bl"
  | "bc"
  | "br";
