import { memo, useCallback } from "react";
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
    (newValue: any) => {
      if (nodeDataId) {
        console.log(newValue);
        updateNodeDataValues({
          nodeDataId,
          values: newValue,
        });
      }
    },
    [nodeDataId, updateNodeDataValues],
  );

  if (!nodeDataValues) return null;

  const initialValue: Value = (nodeDataValues.doc as Value) || [];

  return (
    <WindowPanelFrame xyNode={xyNode} title="Document">
      <DocumentEditorField
        editorId={xyNode.id}
        value={{ doc: initialValue }}
        onChange={(newValue) => handleSave(newValue)}
        isLocked={isLocked}
      />
    </WindowPanelFrame>
  );
}

