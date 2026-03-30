"use client";

import { createPlatePlugin } from "platejs/react";

/**
 * Strips font-family from HTML clipboard content before PlateJS deserializes it.
 * Pasted text will use the editor's default font rather than the source font.
 */
export const StripFontOnPastePlugin = createPlatePlugin({
  key: "strip-font-on-paste",
}).extendEditor(({ editor }) => {
  const { insertData } = editor;

  editor.insertData = (data: DataTransfer) => {
    const html = data.getData("text/html");

    if (html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        doc.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
          el.style.removeProperty("font-family");
          // Remove empty style attribute to keep the DOM clean
          if (!el.getAttribute("style")?.trim()) {
            el.removeAttribute("style");
          }
        });

        const fragment = editor.api.html.deserialize({ element: doc.body });

        if (fragment && fragment.length > 0) {
          editor.tf.insertFragment(fragment);
          return;
        }
      } catch {
        // Fall through to default paste handling
      }
    }

    insertData(data);
  };

  return editor;
});
