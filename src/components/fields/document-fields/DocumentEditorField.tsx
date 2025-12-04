import { memo, useCallback, useRef } from "react";
import type { Value } from "platejs";
import { Editor, EditorContainer } from "@/components/plate/editor";
import { EditorKit } from "@/components/plate/editor-kit";
import { Plate, usePlateEditor } from "platejs/react";
import type { BaseFieldProps } from "@/types/field.types";

interface DocumentEditorFieldProps extends BaseFieldProps<{ doc: Value }> {
  editorId?: string;
}

function DocumentEditorField({
  editorId,
  value,
  onChange,
}: DocumentEditorFieldProps) {
  const initialValue: Value = value?.doc as Value;

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

  return (
    <Plate editor={editor} onValueChange={handleChange}>
      <EditorContainer
        variant="default"
        className="nodrag h-full scrollbar-hide"
      >
        <Editor
          disableDefaultStyles={true}
          variant="none"
          placeholder="Commencez à écrire..."
          className="px-5 py-3 "
        />
      </EditorContainer>
    </Plate>
  );
}

export default memo(DocumentEditorField);
