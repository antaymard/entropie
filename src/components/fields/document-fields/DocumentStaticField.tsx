import { useMemo } from "react";

import { createSlateEditor, type Value } from "platejs";

import { BaseEditorKit } from "@/components/plate/editor-base-kit";
import { EditorStatic } from "@/components/plate/editor-static";
import type { BaseFieldProps } from "@/types/ui";
import { cn } from "@/lib/utils";

interface DocumentStaticFieldProps extends BaseFieldProps<{ doc: Value }> {
  allowDrag?: boolean;
}

export default function DocumentStaticField({
  field,
  value,
  onChange,
  visualSettings,
  allowDrag = false,
}: DocumentStaticFieldProps) {
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
    [value?.doc, isValidDoc],
  );

  if (!isValidDoc) {
    return null;
  }

  return (
    <EditorStatic
      editor={editor}
      className={cn(
        "p-4 nowheel",
        allowDrag ? "select-none cursor-grab" : "nodrag",
      )}
    />
  );
}
