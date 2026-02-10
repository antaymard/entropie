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
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup timers on unmount
  useEffect(() => {
    const debounceTimer = debounceTimerRef;
    const blurTimer = blurTimeoutRef;
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (blurTimer.current) clearTimeout(blurTimer.current);
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
    // Cancel any pending blur (e.g. focus moved from editor to toolbar and back)
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    if (isLocked) return;
    isFocusedRef.current = true;
    setEnableCanvasUndoRedo(false);
  }, [setEnableCanvasUndoRedo, isLocked]);

  const handleBlur = useCallback(() => {
    // Delay blur to handle toolbar/portal clicks that temporarily steal focus
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;
      isFocusedRef.current = false;
      setEnableCanvasUndoRedo(true);

      const hadPending = pendingValueRef.current !== null;
      flushChanges();

      if (!hadPending && pendingRemoteValueRef.current) {
        editor.tf.setValue(pendingRemoteValueRef.current);
        pendingRemoteValueRef.current = null;
      }
    }, 150);
  }, [setEnableCanvasUndoRedo, flushChanges, editor]);

  return (
    <div
      className="relative h-full"
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <Plate editor={editor} onValueChange={handleChange}>
        <EditorContainer
          variant="default"
          className={cn(
            "nodrag h-full overflow-auto",
            visualType === "window" && "border border-slate-300",
          )}
        >
          <Editor
            disableDefaultStyles={true}
            variant="none"
            placeholder="Commencez à écrire..."
            className="px-5 py-3"
            readOnly={isLocked}
          />
        </EditorContainer>
      </Plate>
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="size-4" />
            IA en cours...
          </span>
        </div>
      )}
    </div>
  );
});

export default memo(DocumentEditorField);
