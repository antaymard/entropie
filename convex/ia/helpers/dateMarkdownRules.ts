/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Règles markdown pour l'élément inline `date` de Plate.
 *
 * Sérialisation : { type: "date", date: "Mon May 18 2026" }
 *   → <date value="2026-05-18">18 mai 2026</date>
 *
 * Désérialisation : <date value="2026-05-18">…</date>
 *   → { type: "date", date: "2026-05-18", children: [{ text: "" }] }
 *
 * Fichier dupliqué de src/components/plate/dateMarkdownRules.ts pour le
 * runtime Convex (imports dynamiques pour éviter le scan top-level).
 */
function toIsoDate(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function buildDateMarkdownRules(): Promise<Record<string, any>> {
  return {
    date: {
      deserialize: (mdastNode: any) => {
        const valueAttr = mdastNode.attributes?.find(
          (attr: any) => attr.name === "value",
        );
        const raw =
          typeof valueAttr?.value === "string" ? valueAttr.value : null;
        const iso = raw ? toIsoDate(raw) : null;
        return {
          type: "date",
          date: iso ?? raw ?? "",
          children: [{ text: "" }],
        };
      },
      serialize: (slateNode: any) => {
        const iso = toIsoDate(slateNode.date);
        const label = iso ? formatDateLabel(iso) : "[Date non définie]";
        return {
          type: "mdxJsxTextElement",
          name: "date",
          attributes: iso
            ? [{ type: "mdxJsxAttribute", name: "value", value: iso }]
            : [],
          children: [{ type: "text", value: label }],
        };
      },
    },
  };
}
