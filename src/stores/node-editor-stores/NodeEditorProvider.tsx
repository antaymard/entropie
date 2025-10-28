import { useState } from "react";
import type { ReactNode } from "react";
import { NodeEditorContext } from "./NodeEditorContext";

export function NodeEditorProvider({ children }: { children: ReactNode }) {
  const [overElementId, setOverElementId] = useState<string | null>(null);
  const [visualToEditPath, setVisualToEditPath] = useState<string>(
    "visuals.node.default.layout"
  );

  return (
    <NodeEditorContext.Provider
      value={{
        overElementId,
        setOverElementId,
        visualToEditPath,
        setVisualToEditPath,
      }}
    >
      {children}
    </NodeEditorContext.Provider>
  );
}
