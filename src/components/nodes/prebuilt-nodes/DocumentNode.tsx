import { useCallback } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import { Plate, usePlateEditor } from "platejs/react";
import { normalizeNodeId, type Value } from "platejs";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import { EditorKit } from "@/components/editor-kit";
import { Editor, EditorContainer } from "@/components/shadcn/editor";

const defaultValue: Value = normalizeNodeId([
  {
    children: [{ text: "Start typing..." }],
    type: "p",
  },
]);

export default function DocumentNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();

  // Récupère la valeur depuis les données du nœud ou utilise la valeur par défaut
  const initialValue: Value =
    (xyNode.data?.doc as Value | undefined) ?? defaultValue;

  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValue,
  });

  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      console.log("DocumentNode value changed:", value);
      // Met à jour les données du nœud ReactFlow à chaque changement
      updateNodeData(xyNode.id, { doc: value });
    },
    [updateNodeData, xyNode.id]
  );

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}></CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode} nodeContentClassName="p-0">
        <Plate editor={editor} onValueChange={handleChange} readOnly>
          <EditorContainer variant="default" className="nodrag h-full">
            <Editor
              variant="none"
              placeholder="Commencez à écrire..."
              className="size-full p-3"
            />
          </EditorContainer>
        </Plate>
      </NodeFrame>
    </>
  );
}
