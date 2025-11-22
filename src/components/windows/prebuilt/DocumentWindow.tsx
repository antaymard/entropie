import { useReactFlow, useStore } from "@xyflow/react";
import { memo, useCallback } from "react";
import type { Node } from "@xyflow/react";
import type { Value } from "platejs";
import { Editor, EditorContainer } from "@/components/shadcn/editor";
import { EditorKit } from "@/components/editor-kit";
import { Plate, usePlateEditor } from "platejs/react";
import WindowFrame from "../WindowFrame";

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

  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValue,
  });

  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      console.log("DocumentNode value changed:", value);
      // Met à jour les données du nœud ReactFlow à chaque changement
      updateNodeData(windowId, { doc: value });
    },
    [updateNodeData, windowId]
  );

  return (
    <WindowFrame windowId={windowId}>
      <Plate editor={editor} onValueChange={handleChange}>
        <EditorContainer variant="default" className="nodrag h-full">
          <Editor
            variant="none"
            placeholder="Commencez à écrire..."
            className="size-full"
          />
        </EditorContainer>
      </Plate>
    </WindowFrame>
  );
}

export default memo(DocumentWindow);
