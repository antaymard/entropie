import { useMemo } from "react";

import { createSlateEditor, type Value } from "platejs";

import { BaseEditorKit } from "@/components/plate/editor-base-kit";
import { EditorStatic } from "@/components/plate/editor-static";
import type { BaseFieldProps } from "@/types/field.types";

export default function DocumentStaticField({
  field,
  value,
  onChange,
  visualSettings,
}: BaseFieldProps<{ doc: Value }>) {
  const editor = useMemo(
    () =>
      createSlateEditor({
        plugins: BaseEditorKit,
        value: value?.doc,
      }),
    [value?.doc]
  );

  if (!value?.doc || value.doc.length === 0) {
    return null;
  }

  return <EditorStatic editor={editor} className="p-4 nowheel nodrag" />;
}
