import { useCallback, useEffect, useRef } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import { Plate, usePlateEditor } from "platejs/react";
import { normalizeNodeId, type Value } from "platejs";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import { EditorKit } from "@/components/editor-kit";
import { Editor, EditorContainer } from "@/components/shadcn/editor";

const defaultValue: Value = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

export default function DocumentNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();

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

  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      console.log("DocumentNode value changed:", value);
      // Met à jour les données du nœud ReactFlow à chaque changement
      updateNodeData(xyNode.id, { doc: value });
    },
    [updateNodeData, xyNode.id]
  );

  // // Garde une référence de la dernière valeur pour éviter les updates inutiles
  // const lastValueRef = useRef<Value>(currentValue);

  // useEffect(() => {
  //   // Compare la nouvelle valeur avec l'ancienne (comparaison par JSON)
  //   const newValueStr = JSON.stringify(currentValue);
  //   const lastValueStr = JSON.stringify(lastValueRef.current);

  //   if (editor && newValueStr !== lastValueStr) {
  //     editor.tf.setValue(currentValue);
  //     lastValueRef.current = currentValue;
  //   }
  // }, [editor, currentValue]);

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}></CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode} nodeContentClassName="p-0">
        <Plate editor={editor} onValueChange={handleChange} readOnly>
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
}
