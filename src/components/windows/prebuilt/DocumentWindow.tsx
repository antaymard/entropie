import { useCallback, useMemo } from "react";
import type { Node } from "@xyflow/react";
import type { Value } from "platejs";
import DocumentEditorField from "@/components/fields/document-fields/DocumentEditorField";
import WindowPanelFrame from "../WindowPanelFrame";
import { useNodeData, useNodeDataValues } from "@/hooks/useNodeData";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import type { Id } from "@/../convex/_generated/dataModel";

export default function DocumentWindow({ xyNode }: { xyNode: Node }) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas">;
  const nodeDataValues = useNodeDataValues(nodeDataId);
  const nodeData = useNodeData(nodeDataId);
  const isLocked = nodeData?.status === "working";
  const { updateNodeDataValues } = useUpdateNodeDataValues();

  const handleSave = useCallback(
    (newValue: { doc: Value }) => {
      if (nodeDataId) {
        updateNodeDataValues({
          nodeDataId,
          values: newValue,
        });
      }
    },
    [nodeDataId, updateNodeDataValues],
  );

  const editorValue = useMemo(
    () => ({ doc: (nodeDataValues?.doc as Value) || [] }),
    [nodeDataValues?.doc],
  );

  if (!nodeDataValues) return null;

  return (
    <WindowPanelFrame xyNode={xyNode} title="Document">
      <DocumentEditorField
        editorId={xyNode.id}
        value={editorValue}
        onChange={handleSave}
        isLocked={isLocked}
      />
    </WindowPanelFrame>
  );
}

