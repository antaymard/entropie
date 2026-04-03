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

  // Stabilize dependency: serialize to string so the editor is only recreated
  // when the document content actually changes, not on every new object reference.
  const docKey = isValidDoc ? JSON.stringify(value.doc) : "";

  const editor = useMemo(
    () =>
      createSlateEditor({
        plugins: BaseEditorKit,
        value: isValidDoc
          ? value.doc
          : [{ type: "p", children: [{ text: "" }] }],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docKey],
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
