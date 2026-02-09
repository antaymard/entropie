"use client";

import { createPlatePlugin } from "platejs/react";

import { PillLeaf } from "./pill-node";

export const PillPlugin = createPlatePlugin({
  key: "pill",
  node: { isLeaf: true },
  handlers: {
    onKeyDown:
      ({ editor, plugin }) =>
      (event) => {
        const isPillActive = !!editor.api.mark(plugin.key);
        if (!isPillActive) return;

        // Sortir du pill sur Entrée
        if (event.key === "Enter") {
          setTimeout(() => {
            if (editor.selection) {
              editor.tf.select(editor.selection);
              editor.tf.removeMarks(plugin.key);
            }
          }, 0);
          return;
        }

        // Sortir du pill sur double espace
        if (event.key === " ") {
          const { selection } = editor;
          if (selection && selection.anchor) {
            try {
              const [node] = editor.api.node(selection) || [];
              if (node?.text) {
                const offset = selection.anchor.offset;
                if (offset > 0 && node.text[offset - 1] === " ") {
                  event.preventDefault();
                  editor.deleteBackward("character");
                  editor.tf.removeMarks(plugin.key);
                  editor.insertText(" ");
                  return;
                }
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }
      },
  },
}).configure({
  node: { component: PillLeaf },
  shortcuts: { toggle: { keys: "mod+shift+p" } },
});

export const PillKit = [PillPlugin];
