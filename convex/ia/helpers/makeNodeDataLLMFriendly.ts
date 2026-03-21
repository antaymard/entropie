import { Doc } from "../../_generated/dataModel";
import { plateJsonToMarkdown } from "./plateMarkdownConverter";

/**
 * Formate les values d'un seul nodeData en markdown lisible pour un LLM.
 * Convertit notamment le contenu PlateJS des nodes `document` en markdown.
 */
export function makeNodeDataLLMFriendly(nodeData: Doc<"nodeDatas">): string {
  const values = nodeData.values;

  switch (nodeData.type) {
    case "document": {
      const doc = values.doc;
      if (Array.isArray(doc)) {
        return plateJsonToMarkdown(doc);
      }
      return typeof doc === "string" ? doc : JSON.stringify(doc);
    }

    case "value": {
      const val = values.value;
      if (!val) return "(aucune valeur)";
      const parts: string[] = [];
      if (val.label) parts.push(`**${val.label}** :`);
      parts.push(String(val.value));
      if (val.unit) parts.push(val.unit);
      return parts.join(" ");
    }

    case "link": {
      const link = values.link;
      if (!link) return "(aucun lien)";
      return `[${link.pageTitle || link.href}](${link.href})`;
    }

    case "image": {
      const images = values.images as Array<{ url: string }> | undefined;
      if (!images || images.length === 0) return "(aucune image)";
      return images.map((img) => `![image](${img.url})`).join("\n");
    }

    case "floatingText": {
      const text = values.text ?? "";
      const level = values.level as string | undefined;
      const prefix =
        level === "h1"
          ? "# "
          : level === "h2"
            ? "## "
            : level === "h3"
              ? "### "
              : "";
      return `${prefix}${text}`;
    }

    case "file": {
      const files = values.files as
        | Array<{ url: string; filename: string; mimeType?: string }>
        | undefined;
      if (!files || files.length === 0) return "(aucun fichier)";
      return files
        .map(
          (f) =>
            `- [${f.filename}](${f.url})${f.mimeType ? ` (${f.mimeType})` : ""}`,
        )
        .join("\n");
    }

    default:
      return JSON.stringify(values);
  }
}
