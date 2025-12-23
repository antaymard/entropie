import { useReactFlow, useStore } from "@xyflow/react";
import { memo } from "react";
import type { Node } from "@xyflow/react";
import type { Value } from "platejs";
import WindowFrame from "../WindowFrame";
import DocumentEditorField from "@/components/fields/document-fields/DocumentEditorField";

interface DocumentWindowProps {
  windowId: string;
}

function DocumentWindow({ windowId }: DocumentWindowProps) {
  // Récupère uniquement la data du node, re-render uniquement quand elle change
  const nodeData = useStore(
    (state) => state.nodes.find((n: Node) => n.id === windowId)?.data
  );
  const { updateNodeData } = useReactFlow();
  // Récupère la valeur depuis les données du nœud ou utilise la valeur par défaut
  const initialValue: Value = nodeData?.doc as Value;

  return (
    <WindowFrame windowId={windowId} contentClassName="p-0!" floatable={false}>
      <DocumentEditorField
        editorId={windowId}
        value={{ doc: initialValue }}
        onChange={(newValue) => updateNodeData(windowId, newValue)}
      />
    </WindowFrame>
  );
}

export default memo(DocumentWindow);
