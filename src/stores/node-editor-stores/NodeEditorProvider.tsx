import { useState } from "react";
import type { ReactNode } from "react";
import { NodeEditorContext } from "./NodeEditorContext";

export function NodeEditorProvider({ children }: { children: ReactNode }) {
  const [overElementId, setOverElementId] = useState<string | null>(null);
  const [currentVisualLayoutPath, setCurrentVisualLayoutPath] =
    useState<string>("visuals.node.default.layout");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );

  return (
    <NodeEditorContext.Provider
      value={{
        overElementId,
        setOverElementId,
        currentVisualLayoutPath,
        setCurrentVisualLayoutPath,
        selectedElementId,
        setSelectedElementId,
      }}
    >
      {children}
    </NodeEditorContext.Provider>
  );
}
