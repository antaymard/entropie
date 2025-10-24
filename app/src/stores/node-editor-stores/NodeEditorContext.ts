import { createContext } from "react";

export interface NodeEditorContextType {
  overElementId: string | null;
  setOverElementId: (id: string | null) => void;
  currentVisualLayoutPath: string;
  setCurrentVisualLayoutPath: (path: string) => void;
  selectedElementId?: string | null;
  setSelectedElementId?: (id: string | null) => void;
}

export const NodeEditorContext = createContext<
  NodeEditorContextType | undefined
>(undefined);
