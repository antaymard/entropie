/**
 * Central export for all Convex types
 * Use this to import Convex types in the frontend with clean paths
 *
 * @example
 * import type { Canvas, CanvasNode, NodeData } from "@/types/convex";
 */

import type { ChatModelPreference } from "@/../convex/ia/agents";

export * from "./canvas";
export * from "./nodeData";

// Forward selected shared Convex domain types to the frontend
export type { ChatModelPreference } from "@/../convex/ia/agents";

// Derived client-side from ChatModelPreference — TS will error if values drift
export const chatModelPreferences: ChatModelPreference[] = [
  "best",
  "high",
  "regular",
  "free",
  "fast",
];

// Also re-export generated Convex types for convenience
export type { Id, Doc } from "@/../convex/_generated/dataModel";
