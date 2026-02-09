/**
 * Central export for all Convex types
 * Use this to import Convex types in the frontend with clean paths
 *
 * @example
 * import type { Canvas, CanvasNode, NodeData } from "@/types/convex";
 */

export * from "./canvas";
export * from "./nodeData";

// Also re-export generated Convex types for convenience
export type { Id, Doc } from "@/../convex/_generated/dataModel";
