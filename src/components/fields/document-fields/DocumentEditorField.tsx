import { memo, useCallback, useRef } from "react";
import type { Value } from "platejs";
import { Editor, EditorContainer } from "@/components/plate/editor";
import { EditorKit } from "@/components/plate/editor-kit";
import { Plate, usePlateEditor } from "platejs/react";
import type { BaseFieldProps } from "@/types/field.types";
import { useCanvasStore } from "@/stores/canvasStore";
import { cn } from "@/lib/utils";

interface DocumentEditorFieldProps extends BaseFieldProps<{ doc: Value }> {
  editorId?: string;
}

function DocumentEditorField({
  editorId,
  value,
  visualType,
  onChange,
}: DocumentEditorFieldProps) {
  const initialValue: Value = value?.doc as Value;
  const setEnableCanvasUndoRedo = useCanvasStore(
    (s) => s.setEnableCanvasUndoRedo
  );

  const editor = usePlateEditor({
    id: editorId ? `doc-${editorId}` : undefined,
    plugins: EditorKit,
    value: initialValue,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      // Annule le timer précédent si existant
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Crée un nouveau timer pour mettre à jour après 300ms
      debounceTimerRef.current = setTimeout(() => {
        onChange?.({ doc: value });
      }, 750);
    },
    [onChange]
  );

  // Désactive l'undo/redo du canvas lors de la focalisation de l'éditeur
  const handleFocus = useCallback(() => {
    setEnableCanvasUndoRedo(false);
  }, [setEnableCanvasUndoRedo]);

  const handleBlur = useCallback(() => {
    setEnableCanvasUndoRedo(true);
  }, [setEnableCanvasUndoRedo]);

  return (
    <Plate editor={editor} onValueChange={handleChange}>
      <EditorContainer
        variant="default"
        className={cn(
          "nodrag h-full rounded-md",
          visualType === "window" && "border border-slate-300"
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
}

export default memo(DocumentEditorField);
