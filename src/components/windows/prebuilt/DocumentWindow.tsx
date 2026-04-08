import type { Value } from "platejs";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import DocumentEditorField, {
  type DocumentEditorFieldHandle,
} from "@/components/fields/document-fields/DocumentEditorField";
import {
  useNodeData,
  useNodeDataValues,
  useNodeDataUpdatedAt,
} from "@/hooks/useNodeData";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import type { Id } from "@/../convex/_generated/dataModel";
import { useWindowFrameContext } from "@/components/windows/WindowFrameContext";

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
  const updatedAt = useNodeDataUpdatedAt(nodeDataId);
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

  // Le doc arrive déjà parsé depuis Convex — updatedAt (number) comme clé useMemo
  // pour la stabilité des références.
  const editorValue = useMemo(() => {
    const doc = nodeDataValues?.doc;
    return {
      doc: Array.isArray(doc) && doc.length > 0 ? (doc as Value) : [],
    };
  }, [updatedAt]);

  if (!nodeDataValues) return null;

  return (
    <DocumentEditorField
      ref={editorRef}
      editorId={xyNodeId}
      value={editorValue}
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
