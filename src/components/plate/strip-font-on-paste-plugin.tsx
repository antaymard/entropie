"use client";

import { createPlatePlugin } from "platejs/react";

/**
 * Strips font-family from HTML clipboard content before PlateJS deserializes it.
 * Pasted text will use the editor's default font rather than the source font.
 */
export const StripFontOnPastePlugin = createPlatePlugin({
  key: "strip-font-on-paste",
  handlers: {
    onPaste: ({ editor, event }) => {
      const html = event.clipboardData?.getData("text/html");
      if (!html) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      let hasFont = false;
      doc.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
        if (el.style.fontFamily) {
          el.style.removeProperty("font-family");
          hasFont = true;
          if (!el.getAttribute("style")?.trim()) {
            el.removeAttribute("style");
          }
        }
      });

      if (!hasFont) return;

      event.preventDefault();

      const fragment = editor.api.html.deserialize({ element: doc.body });
      if (fragment?.length) {
        editor.tf.insertFragment(fragment);
      }
    },
  },
});
