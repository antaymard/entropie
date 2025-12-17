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
  // Vérifier que doc est bien un tableau valide pour Plate.js
  const isValidDoc = Array.isArray(value?.doc) && value.doc.length > 0;

  const editor = useMemo(
    () =>
      createSlateEditor({
        plugins: BaseEditorKit,
        value: isValidDoc
          ? value.doc
          : [{ type: "p", children: [{ text: "" }] }],
      }),
    [value?.doc, isValidDoc]
  );

  if (!isValidDoc) {
    return null;
  }

  return <EditorStatic editor={editor} className="p-4 nowheel nodrag " />;
}
