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
import { Spinner } from "@/components/shadcn/spinner";

export interface DocumentEditorFieldHandle {
  flushChanges: () => void;
}

interface DocumentEditorFieldProps extends BaseFieldProps<{ doc: Value }> {
  editorId?: string;
  plugins?: typeof EditorKit;
  isLocked?: boolean;
}

const DocumentEditorField = forwardRef<
  DocumentEditorFieldHandle,
  DocumentEditorFieldProps
>(function DocumentEditorField(
  { editorId, value, visualType, onChange, plugins = EditorKit, isLocked },
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
  const isFocusedRef = useRef(false);
  const pendingRemoteValueRef = useRef<Value | null>(null);

  // Sync external value changes into the editor
  // Only apply when NOT focused (or when locked by AI)
  useEffect(() => {
    if (!initialValue) return;

    if (isLocked || !isFocusedRef.current) {
      editor.tf.setValue(initialValue);
      pendingRemoteValueRef.current = null;
    } else {
      // Focused and not locked: store for later
      pendingRemoteValueRef.current = initialValue;
    }
  }, [initialValue, editor, isLocked]);

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
      onChange?.({ doc: pendingValueRef.current });
      pendingValueRef.current = null;
    }
  }, [onChange]);

  useImperativeHandle(ref, () => ({ flushChanges }), [flushChanges]);

  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      pendingValueRef.current = value;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onChange?.({ doc: value });
        pendingValueRef.current = null;
      }, 750);
    },
    [onChange],
  );

  const handleFocus = useCallback(() => {
    if (isLocked) return;
    isFocusedRef.current = true;
    setEnableCanvasUndoRedo(false);
  }, [setEnableCanvasUndoRedo, isLocked]);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    setEnableCanvasUndoRedo(true);

    const hadPending = pendingValueRef.current !== null;
    flushChanges();

    // Apply pending remote value only if user didn't have local changes
    if (!hadPending && pendingRemoteValueRef.current) {
      editor.tf.setValue(pendingRemoteValueRef.current);
      pendingRemoteValueRef.current = null;
    }
  }, [setEnableCanvasUndoRedo, flushChanges, editor]);

  return (
    <Plate editor={editor} onValueChange={handleChange}>
      <div className="relative h-full">
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
            readOnly={isLocked}
          />
        </EditorContainer>
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded">
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <Spinner className="size-4" />
              IA en cours...
            </span>
          </div>
        )}
      </div>
    </Plate>
  );
});

export default memo(DocumentEditorField);
