import { createContext } from "react";

export interface NodeEditorContextType {
  overElementId: string | null;
  setOverElementId: (id: string | null) => void;
  currentVisualLayoutPath: string;
  setCurrentVisualLayoutPath: (path: string) => void;
}

export const NodeEditorContext = createContext<
  NodeEditorContextType | undefined
>(undefined);
