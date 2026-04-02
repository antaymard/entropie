import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
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
  save: () => void;
}

interface DocumentEditorFieldProps extends BaseFieldProps<{ doc: Value }> {
  editorId?: string;
  plugins?: typeof EditorKit;
  isLocked?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  valueVersion?: number;
}

const DocumentEditorField = forwardRef<
  DocumentEditorFieldHandle,
  DocumentEditorFieldProps
>(function DocumentEditorField(
  {
    editorId,
    value,
    visualType,
    onChange,
    plugins = EditorKit,
    isLocked,
    onDirtyChange,
    valueVersion,
  },
  ref,
) {
  const initialValue: Value = value?.doc as Value;
  const setFocus = useCanvasStore((s) => s.setFocus);
  const skipNextChangeRef = useRef(false);
  const editorScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastAppliedVersionRef = useRef<number | null>(null);

  const editor = usePlateEditor({
    id: editorId ? `doc-${editorId}` : undefined,
    plugins,
    value: initialValue,
  });

  // Last Write Wins, but only when server version changes.
  useEffect(() => {
    if (!initialValue) return;

    if (
      valueVersion !== undefined &&
      lastAppliedVersionRef.current === valueVersion
    ) {
      return;
    }

    const previousScrollTop = editorScrollContainerRef.current?.scrollTop ?? null;
    skipNextChangeRef.current = true;
    editor.tf.setValue(initialValue);
    if (valueVersion !== undefined) {
      lastAppliedVersionRef.current = valueVersion;
    }

    if (previousScrollTop !== null) {
      requestAnimationFrame(() => {
        if (editorScrollContainerRef.current) {
          editorScrollContainerRef.current.scrollTop = previousScrollTop;
        }
      });
    }

    onDirtyChange?.(false);
  }, [initialValue, valueVersion, editor, onDirtyChange]);

  const save = useCallback(() => {
    onChange?.({ doc: editor.children as Value });
    onDirtyChange?.(false);
  }, [onChange, onDirtyChange, editor]);

  useImperativeHandle(ref, () => ({ save }), [save]);

  const handleChange = useCallback(() => {
    if (skipNextChangeRef.current) {
      skipNextChangeRef.current = false;
      return;
    }
    onDirtyChange?.(true);
  }, [onDirtyChange]);

  const handleFocus = useCallback(() => {
    if (isLocked) return;
    setFocus("platejs");
  }, [setFocus, isLocked]);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) {
        return;
      }

      setFocus("canvas");
    },
    [setFocus],
  );

  return (
    <div className="relative h-full" onFocus={handleFocus} onBlur={handleBlur}>
      <Plate editor={editor} onValueChange={handleChange}>
        <EditorContainer
          ref={editorScrollContainerRef}
          variant="default"
          className={cn(
            "nodrag h-full overflow-auto",
            visualType === "window" && "border border-slate-300",
          )}
        >
          <Editor
            disableDefaultStyles={true}
            variant="none"
            placeholder="Start writing..."
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
