import { createContext } from "react";

export interface NodeEditorContextType {
  overElementId: string | null;
  setOverElementId: (id: string | null) => void;
  visualToEditPath: string;
  setVisualToEditPath: (path: string) => void;
}

export const NodeEditorContext = createContext<
  NodeEditorContextType | undefined
>(undefined);
