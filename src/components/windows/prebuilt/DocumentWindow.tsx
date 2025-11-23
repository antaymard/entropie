import { useReactFlow, useStore } from "@xyflow/react";
import { memo, useCallback, useRef } from "react";
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
    id: `doc-${windowId}`,
    plugins: EditorKit,
    value: initialValue,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      // Annule le timer précédent si existant
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Crée un nouveau timer pour mettre à jour après 300ms
      debounceTimerRef.current = setTimeout(() => {
        updateNodeData(windowId, { doc: value });
      }, 750);
    },
    [updateNodeData, windowId]
  );

  return (
    <WindowFrame windowId={windowId} contentClassName="p-0!">
      <Plate editor={editor} onValueChange={handleChange}>
        <EditorContainer
          variant="default"
          className="nodrag h-full scrollbar-hide"
        >
          <Editor
            disableDefaultStyles={true}
            variant="none"
            placeholder="Commencez à écrire..."
            className="px-5 py-3 "
          />
        </EditorContainer>
      </Plate>
    </WindowFrame>
  );
}

export default memo(DocumentWindow);
