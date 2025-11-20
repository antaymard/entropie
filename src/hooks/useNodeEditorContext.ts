import { useContext } from "react";
import { NodeEditorContext } from "../stores/node-editor-stores/NodeEditorContext";
import type { NodeEditorContextType } from "../stores/node-editor-stores/NodeEditorContext";

export function useNodeEditorContext(): NodeEditorContextType {
  const context = useContext(NodeEditorContext);

  if (!context) {
    throw new Error(
      "useNodeEditorContext must be used within a NodeEditorContext provider"
    );
  }

  return context;
}

export function useOptionalNodeEditorContext():
  | NodeEditorContextType
  | undefined {
  return useContext(NodeEditorContext);
}
