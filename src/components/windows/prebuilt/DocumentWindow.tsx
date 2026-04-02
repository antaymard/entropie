import { normalizeNodeId, type Value } from "platejs";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import DocumentEditorField, {
  type DocumentEditorFieldHandle,
} from "@/components/fields/document-fields/DocumentEditorField";
import { useNodeData, useNodeDataValues } from "@/hooks/useNodeData";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import type { Id } from "@/../convex/_generated/dataModel";
import { useWindowFrameContext } from "@/components/windows/WindowFrameContext";
import { parseStoredPlateDocument } from "@/../convex/lib/plateDocumentStorage";

interface DocumentWindowProps {
  xyNodeId: string;
  nodeDataId: Id<"nodeDatas">;
}

function DocumentWindow({ xyNodeId, nodeDataId }: DocumentWindowProps) {
  const editorRef = useRef<DocumentEditorFieldHandle>(null);
  const [isDirty, setIsDirty] = useState(false);
  const { setDirty, setSaveHandler } = useWindowFrameContext();
  const nodeDataValues = useNodeDataValues(nodeDataId);
  const nodeData = useNodeData(nodeDataId);
  const isLocked = nodeData?.status === "working";
  const { updateNodeDataValues } = useUpdateNodeDataValues();

  const handleSaveClick = useCallback(() => {
    editorRef.current?.save();
  }, []);

  useEffect(() => {
    setSaveHandler(() => handleSaveClick);
    return () => setSaveHandler(null);
  }, [handleSaveClick, setSaveHandler]);

  useEffect(() => {
    setDirty(isDirty && !isLocked);
  }, [isDirty, isLocked, setDirty]);

  const handleSave = useCallback(
    (newValue: { doc: Value }) => {
      updateNodeDataValues({
        nodeDataId,
        values: newValue,
      });
    },
    [nodeDataId, updateNodeDataValues],
  );

  const editorValue = useMemo(() => {
    const parsedDoc = parseStoredPlateDocument(nodeDataValues?.doc);
    return { doc: parsedDoc ? normalizeNodeId(parsedDoc as Value) : [] };
  }, [nodeDataValues?.doc]);

  if (!nodeDataValues) return null;

  return (
    <DocumentEditorField
      ref={editorRef}
      editorId={xyNodeId}
      value={editorValue}
      valueVersion={nodeData?.updatedAt}
      onChange={handleSave}
      isLocked={isLocked}
      onDirtyChange={setIsDirty}
    />
  );
}

export default memo(
  DocumentWindow,
  (prev, next) =>
    prev.xyNodeId === next.xyNodeId && prev.nodeDataId === next.nodeDataId,
);
