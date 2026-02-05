import { Id } from "../../convex/_generated/dataModel";

export type nodeTypes = "document" | "floatingText" | "image" | "link" | "value";

export interface NodeData {
  _id: Id<"nodeDatas">;
  _creationTime: number;
  templateId?: Id<"nodeTemplates">;
  template?: any; // Override templateId if on the spot template is needed
  type: string;
  updatedAt: number;
  removedFromCanvasAt?: number;

  values: Record<string, any>; // Field values
  status?: "idle" | "working" | "error";

  agent?: {
    model: string;
    instructions: string;
    touchableFields?: string[];
  };

  dataProcessing?: Array<{
    field: string; // Field to update with the processed data
    sourceNode: Id<"nodeDatas">;
    expression: string; // JSONata expression to process the data
  }>;

  automationMode?: "agent" | "dataProcessing" | "off";

  dependencies?: Array<{
    nodeDataId: Id<"nodeDatas">;
    field?: string;
    type: "input" | "output";
    degree?: number;
    shouldTriggerUpdate?: boolean;
  }>;
}
