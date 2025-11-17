import type { Id } from "../../convex/_generated/dataModel";
import type { CanvasNode } from "./node.types";
import type { Edge } from "@xyflow/react";

export interface Canvas {
    // Same as convex schema
    _id: Id<"canvases">;
    _creationTime: number;
    creatorId: Id<"users">;
    name: string;
    icon?: string;
    description?: string;
    nodes: CanvasNode[];
    edges: Edge[];
    updatedAt: number;
}