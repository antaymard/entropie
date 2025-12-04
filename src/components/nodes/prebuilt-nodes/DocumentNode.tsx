import { memo } from "react";
import { type Node } from "@xyflow/react";
import { normalizeNodeId, type Value } from "platejs";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import DocumentStaticField from "@/components/fields/document-fields/DocumentStaticField";

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

    return (
      <>
        <CanvasNodeToolbar xyNode={xyNode}></CanvasNodeToolbar>
        <NodeFrame xyNode={xyNode} nodeContentClassName="p-0">
          <DocumentStaticField value={{ doc: currentValue }} />
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
      prev.data?.doc === next.data?.doc &&
      prev.data?.color === next.data?.color &&
      prev.data?.name === next.data?.name
    );
  }
);

export default DocumentNode;
