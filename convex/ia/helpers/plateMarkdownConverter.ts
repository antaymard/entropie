/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlateEditor } from "platejs";
import { MarkdownPlugin, remarkMdx, remarkMention } from "@platejs/markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { pillMarkdownRules } from "./pillMarkdownRules";

/**
 * Éditeur headless (sans React/DOM) utilisé uniquement pour la conversion
 * markdown ↔ Plate JSON côté serveur (Convex).
 *
 * Configuré avec les mêmes remark plugins que le front-end (markdown-kit.tsx)
 * pour garantir un round-trip cohérent.
 */
const converter = createSlateEditor({
  plugins: [
    MarkdownPlugin.configure({
      options: {
        remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkMention],
        rules: {
          ...pillMarkdownRules,
          // Pour la sérialisation Plate→Markdown (lecture par le LLM) :
          // on convertit les éléments `date` en texte lisible plutôt qu'en MDX.
          date: {
            serialize: (slateNode: any) => {
              if (!slateNode.date) {
                return { type: "text", value: "[Date non définie]" };
              }
              const d = new Date(slateNode.date);
              return {
                type: "text",
                value: d.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              };
            },
          },
        },
      },
    }),
  ],
});

/**
 * Convertit une chaîne Markdown en Plate.js JSON (Slate Value).
 */
export function markdownToPlateJson(markdown: string): any[] {
  return converter.api.markdown.deserialize(markdown);
}

/**
 * Convertit du Plate.js JSON (Slate Value) en chaîne Markdown.
 * Avec `withBlockId: true`, préfixe chaque bloc de premier niveau par `[block:id]`.
 */
export function plateJsonToMarkdown(
  nodes: any[],
  options?: { withBlockId?: boolean },
): string {
  if (!options?.withBlockId) {
    return converter.api.markdown.serialize({ value: nodes });
  }

  return nodes
    .map((node) => {
      const md = converter.api.markdown.serialize({ value: [node] }).trim();
      if (node.id && md) {
        return `[block:${node.id}]\n${md}`;
      }
      return md;
    })
    .filter(Boolean)
    .join("\n\n");
}
