import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import type { Value } from "platejs";
import { Editor, EditorContainer } from "@/components/plate/editor";
import { EditorKit } from "@/components/plate/editor-kit";
import { Plate, usePlateEditor } from "platejs/react";
import type { BaseFieldProps } from "@/types/ui";
import { useCanvasStore } from "@/stores/canvasStore";
import { cn } from "@/lib/utils";

export interface DocumentEditorFieldHandle {
  flushChanges: () => void;
}

interface DocumentEditorFieldProps extends BaseFieldProps<{ doc: Value }> {
  editorId?: string;
  plugins?: typeof EditorKit;
}

const DocumentEditorField = forwardRef<
  DocumentEditorFieldHandle,
  DocumentEditorFieldProps
>(function DocumentEditorField(
  { editorId, value, visualType, onChange, plugins = EditorKit },
  ref,
) {
  const initialValue: Value = value?.doc as Value;
  const setEnableCanvasUndoRedo = useCanvasStore(
    (s) => s.setEnableCanvasUndoRedo,
  );

  const editor = usePlateEditor({
    id: editorId ? `doc-${editorId}` : undefined,
    plugins,
    value: initialValue,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<Value | null>(null);
  const lastSentValueRef = useRef<string | null>(null);

  // Sync external value changes (e.g. server updates) into the editor
  // Skip if incoming value matches what we last sent (our own echo from Convex)
  useEffect(() => {
    if (initialValue) {
      const incoming = JSON.stringify(initialValue);
      if (incoming !== lastSentValueRef.current) {
        editor.tf.setValue(initialValue);
      }
    }
  }, [initialValue, editor]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const flushChanges = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingValueRef.current !== null) {
      lastSentValueRef.current = JSON.stringify(pendingValueRef.current);
      onChange?.({ doc: pendingValueRef.current });
      pendingValueRef.current = null;
    }
  }, [onChange]);

  useImperativeHandle(ref, () => ({ flushChanges }), [flushChanges]);

  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      // Stocke la valeur en attente
      pendingValueRef.current = value;

      // Annule le timer précédent si existant
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Crée un nouveau timer pour mettre à jour après 750ms
      debounceTimerRef.current = setTimeout(() => {
        lastSentValueRef.current = JSON.stringify(value);
        onChange?.({ doc: value });
        pendingValueRef.current = null;
      }, 750);
    },
    [onChange],
  );

  // Désactive l'undo/redo du canvas lors de la focalisation de l'éditeur
  const handleFocus = useCallback(() => {
    setEnableCanvasUndoRedo(false);
  }, [setEnableCanvasUndoRedo]);

  const handleBlur = useCallback(() => {
    setEnableCanvasUndoRedo(true);
    // Flush les changements en attente immédiatement au blur
    flushChanges();
  }, [setEnableCanvasUndoRedo, flushChanges]);

  return (
    <Plate editor={editor} onValueChange={handleChange}>
      <EditorContainer
        variant="default"
        className={cn(
          "nodrag h-full overflow-auto",
          visualType === "window" && "border border-slate-300",
        )}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <Editor
          disableDefaultStyles={true}
          variant="none"
          placeholder="Commencez à écrire..."
          className={cn("px-5 py-3")}
        />
      </EditorContainer>
    </Plate>
  );
});

export default memo(DocumentEditorField);
