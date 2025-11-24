import { memo, useCallback, useEffect, useRef } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import { Plate, usePlateEditor } from "platejs/react";
import { normalizeNodeId, type Value } from "platejs";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import { EditorKit } from "@/components/plate/editor-kit";
import { Editor, EditorContainer } from "@/components/plate/editor";

const defaultValue: Value = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

const DocumentNode = memo(
  function DocumentNode(xyNode: Node) {
    // Récupère la valeur depuis les données du nœud ou utilise la valeur par défaut
    const currentValue: Value =
      (xyNode.data?.doc as Value | undefined) ?? defaultValue;

    const editor = usePlateEditor({
      id: `doc-${xyNode.id}`,
      plugins: EditorKit,
      value: currentValue,
      override: {
        plugins: {
          "fixed-toolbar": {
            enabled: false,
          },
        },
      },
    });

    useEffect(() => {
      if (editor) {
        editor.tf.setValue(currentValue);
      }
    }, [editor, currentValue]);

    return (
      <>
        <CanvasNodeToolbar xyNode={xyNode}></CanvasNodeToolbar>
        <NodeFrame xyNode={xyNode} nodeContentClassName="p-0">
          <Plate editor={editor} readOnly>
            <EditorContainer
              variant="default"
              className="nodrag h-full nowheel prose prose-sm prose-slate max-w-none scrollbar-hide"
            >
              <Editor
                variant="none"
                placeholder="Commencez à écrire..."
                className="p-3"
              />
            </EditorContainer>
          </Plate>
        </NodeFrame>
      </>
    );
  },
  (prev, next) => {
    // 🔥 Ne re-render que si le contenu du document change
    // Ignore les changements de position, selection, etc.
    return (
      prev.id === next.id &&
      prev.selected === next.selected &&
      prev.data?.doc === next.data?.doc
    );
  }
);

export default DocumentNode;
