import { memo, useMemo, useRef } from "react";

import { createSlateEditor, type Value } from "platejs";

import { BaseEditorKit } from "@/components/plate/editor-base-kit";
import { BasePreviewKit } from "@/components/plate/preview-base-kit";
import { EditorStatic } from "@/components/plate/editor-static";
import type { BaseFieldProps } from "@/types/ui";
import { cn } from "@/lib/utils";
import { useNoWheelUnlessZoom } from "@/hooks/useNoWheelUnlessZoom";

interface DocumentStaticFieldProps extends BaseFieldProps<{ doc: Value }> {
  allowDrag?: boolean;
  preview?: boolean;
}

function DocumentStaticField({
  value,
  allowDrag = false,
  preview = false,
}: DocumentStaticFieldProps) {
  // Vérifier que doc est bien un tableau valide pour Plate.js
  const isValidDoc = Array.isArray(value?.doc) && value.doc.length > 0;

  const plugins = preview ? BasePreviewKit : BaseEditorKit;

  const editor = useMemo(
    () =>
      createSlateEditor({
        plugins,
        value: isValidDoc
          ? value.doc
          : [{ type: "p", children: [{ text: "" }] }],
      }),
    [isValidDoc, value?.doc, plugins],
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

export default memo(
  DocumentStaticField,
  (prev, next) =>
    prev.allowDrag === next.allowDrag &&
    prev.preview === next.preview &&
    prev.value?.doc === next.value?.doc,
);
