import { useMemo, useRef } from "react";

import { createSlateEditor, type Value } from "platejs";

import { BaseEditorKit } from "@/components/plate/editor-base-kit";
import { EditorStatic } from "@/components/plate/editor-static";
import type { BaseFieldProps } from "@/types/ui";
import { cn } from "@/lib/utils";
import { useNoWheelUnlessZoom } from "@/hooks/useNoWheelUnlessZoom";

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

  const containerRef = useRef<HTMLDivElement>(null);
  useNoWheelUnlessZoom(containerRef);

  if (!isValidDoc) {
    return null;
  }

  return (
    <div ref={containerRef}>
      <EditorStatic
        editor={editor}
        className={cn("p-4", allowDrag ? "select-none cursor-grab" : "nodrag")}
      />
    </div>
  );
}
