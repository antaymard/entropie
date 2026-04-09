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
  const hydrationFrameRef = useRef<number | null>(null);
  const lastHydratedDocRef = useRef<unknown>(undefined);
  const [isDirty, setIsDirty] = useState(false);
  const [shouldMountEditor, setShouldMountEditor] = useState(false);
  const [editorValue, setEditorValue] = useState<{ doc: Value }>({ doc: [] });
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

  useEffect(() => {
    return () => {
      if (hydrationFrameRef.current !== null) {
        cancelAnimationFrame(hydrationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setShouldMountEditor(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleSave = useCallback(
    (newValue: { doc: Value }) => {
      updateNodeDataValues({
        nodeDataId,
        values: newValue,
      });
    },
    [nodeDataId, updateNodeDataValues],
  );

  const docSource = useMemo(() => nodeDataValues?.doc, [nodeDataValues?.doc]);

  useEffect(() => {
    if (!nodeDataValues) return;
    if (Object.is(lastHydratedDocRef.current, docSource)) return;

    lastHydratedDocRef.current = docSource;

    if (hydrationFrameRef.current !== null) {
      cancelAnimationFrame(hydrationFrameRef.current);
    }

    hydrationFrameRef.current = requestAnimationFrame(() => {
      const parsedDoc = parseStoredPlateDocument(docSource);
      setEditorValue({
        doc: parsedDoc ? normalizeNodeId(parsedDoc as Value) : [],
      });
    });
  }, [docSource, nodeDataValues]);

  if (!nodeDataValues) return null;

  if (!shouldMountEditor) {
    return <div className="h-full w-full" />;
  }

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
