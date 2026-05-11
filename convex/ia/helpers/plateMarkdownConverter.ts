/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildPillMarkdownRules } from "./pillMarkdownRules";

/**
 * Éditeur headless (sans React/DOM) utilisé uniquement pour la conversion
 * markdown ↔ Plate JSON côté serveur (Convex).
 *
 * Configuré avec les mêmes remark plugins que le front-end (markdown-kit.tsx)
 * pour garantir un round-trip cohérent.
 *
 * BaseListPlugin est nécessaire pour que le MarkdownPlugin utilise le modèle
 * de listes indent-based (listStyleType + indent) au lieu du modèle nested
 * (ul > li > lic) qui n'est pas rendu correctement par l'éditeur.
 */
let converterPromise: Promise<any> | null = null;

async function getConverter() {
  if (!converterPromise) {
    converterPromise = Promise.all([
      import("platejs"),
      import("@platejs/markdown"),
      import("@platejs/list"),
      import("remark-gfm"),
      import("remark-math"),
      buildPillMarkdownRules(),
    ]).then(
      ([
        platejsModule,
        markdownModule,
        listModule,
        remarkGfmModule,
        remarkMathModule,
        pillMarkdownRules,
      ]) => {
        const { createSlateEditor } = platejsModule;
        const { MarkdownPlugin, remarkMdx, remarkMention } = markdownModule;
        const { BaseListPlugin } = listModule;
        const remarkGfm = remarkGfmModule.default;
        const remarkMath = remarkMathModule.default;

        return createSlateEditor({
          plugins: [
            BaseListPlugin,
            MarkdownPlugin.configure({
              options: {
                remarkPlugins: [
                  remarkMath,
                  remarkGfm,
                  remarkMdx,
                  remarkMention,
                ],
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
      },
    );
  }

  return converterPromise;
}

/**
 * Convertit une chaîne Markdown en Plate.js JSON (Slate Value).
 */
export async function markdownToPlateJson(markdown: string): Promise<any[]> {
  const converter = await getConverter();
  return converter.api.markdown.deserialize(markdown);
}

/**
 * Convertit du Plate.js JSON (Slate Value) en chaîne Markdown.
 * Avec `withBlockId: true`, préfixe chaque bloc de premier niveau par `[block:id]`.
 */
export async function plateJsonToMarkdown(
  nodes: any[],
  options?: { withBlockId?: boolean },
): Promise<string> {
  const converter = await getConverter();
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
