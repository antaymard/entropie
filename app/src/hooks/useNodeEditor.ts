import { useContext } from "react";
import { NodeEditorContext } from "../stores/node-editor-stores/NodeEditorContext";
import type { NodeEditorContextType } from "../stores/node-editor-stores/NodeEditorContext";

export function useNodeEditor(): NodeEditorContextType {
  const context = useContext(NodeEditorContext);
  if (context === undefined) {
    throw new Error("useNodeEditor must be used within a NodeEditorProvider");
  }
  return context;
}
