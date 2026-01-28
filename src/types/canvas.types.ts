import type { Id } from "@/../convex/_generated/dataModel";

// Miroir parfait de la base convex
export interface CanvasNode {
  id: string; // Pas _id car sous objet de canvas, qui lui un _id
  nodeDataId: Id<"nodeDatas">;
  type: string;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  locked: boolean;
  hidden: boolean;
  zIndex: number;

  parentId?: string;
  extent?: any | null; //  "parent" | [[number, number], [number, number]]
  extendParent?: boolean;
  data?: Record<string, any>;
}

// Miroir parfait de la base convex
export interface CanvasEdge {
  id: string; // pas _id
  source: string; // node id
  target: string; // node id
  sourceHandle?: string;
  targetHandle?: string;
  data: Record<string, any>;
}

// Miroir parfait de la base convex
export interface Canvas {
  // Same as convex schema
  _id: Id<"canvases">;
  _creationTime: number;
  creatorId: Id<"users">;
  name: string;
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
  updatedAt: number;
}
