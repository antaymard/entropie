import { Doc } from "../../_generated/dataModel";
import { plateJsonToMarkdown } from "./plateMarkdownConverter";
import { parseStoredPlateDocument } from "../../lib/plateDocumentStorage";

type TableColumn = {
  id: string;
  name: string;
};

type TableRow = {
  id: string;
  cells?: Record<string, unknown>;
};

type StoredTableValue = {
  columns?: Array<TableColumn>;
  rows?: Array<TableRow>;
};

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function stringifyTableCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    const maybeLink = value as {
      href?: unknown;
      pageTitle?: unknown;
    };
    if (typeof maybeLink.href === "string") {
      const title =
        typeof maybeLink.pageTitle === "string" &&
        maybeLink.pageTitle.length > 0
          ? maybeLink.pageTitle
          : maybeLink.href;
      return `[${title}](${maybeLink.href})`;
    }
    return JSON.stringify(value);
  }

  return String(value);
}

export function makeTableNodeDataLLMFriendly(
  tableValue: unknown,
  titleValue?: unknown,
): string {
  const table = (tableValue ?? {}) as StoredTableValue;
  const columns = Array.isArray(table.columns) ? table.columns : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  const title =
    typeof titleValue === "string" && titleValue.trim().length > 0
      ? titleValue.trim()
      : null;

  if (columns.length === 0 && rows.length === 0) {
    return title ? `### ${title}\n\n(tableau vide)` : "(tableau vide)";
  }

  const headers = ["_rowId", ...columns.map((col) => col.name || col.id)];
  const headerRow = `| ${headers.map(escapeMarkdownTableCell).join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;

  const bodyRows = rows.map((row) => {
    const cells = columns.map((col) => {
      const rawValue = row.cells?.[col.id];
      return escapeMarkdownTableCell(stringifyTableCellValue(rawValue));
    });
    const rowId = escapeMarkdownTableCell(row.id ?? "");
    return `| ${[rowId, ...cells].join(" | ")} |`;
  });

  const tableMarkdown =
    bodyRows.length === 0
      ? (() => {
          const emptyCells = ["*(no rows)*", ...columns.map(() => "")];
          return [
            headerRow,
            separatorRow,
            `| ${emptyCells.map(escapeMarkdownTableCell).join(" | ")} |`,
          ].join("\n");
        })()
      : [headerRow, separatorRow, ...bodyRows].join("\n");

  const columnIdsLegend =
    columns.length === 0
      ? ""
      : [
          "",
          "Column IDs (use these IDs for table_insert_rows and table_update_rows):",
          ...columns.map((col) => `- ${col.id}: ${col.name || col.id}`),
        ].join("\n");

  if (title) {
    return `### ${title}\n\n${tableMarkdown}${columnIdsLegend}`;
  }

  return `${tableMarkdown}${columnIdsLegend}`;
}

/**
 * Formate les values d'un seul nodeData en markdown lisible pour un LLM.
 * Convertit notamment le contenu PlateJS des nodes `document` en markdown.
 */
export function makeNodeDataLLMFriendly(nodeData: Doc<"nodeDatas">): string {
  const values = nodeData.values;

  switch (nodeData.type) {
    case "document": {
      const doc = values.doc;
      const parsedDoc = parseStoredPlateDocument(doc);
      if (parsedDoc) {
        return plateJsonToMarkdown(parsedDoc);
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

    case "text": {
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

    case "file": // To DEP
    case "pdf": {
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

    case "table": {
      return makeTableNodeDataLLMFriendly(values.table, values.title);
    }

    default:
      return JSON.stringify(values);
  }
}

/**
 * Genere le contexte markdown des input nodes pour le prompt d'une automation.
 * Utilise `makeNodeDataLLMFriendly` pour formater chaque node individuellement.
 */
export function generateInputNodesContext(
  inputNodeDatas: Doc<"nodeDatas">[],
): string {
  if (inputNodeDatas.length === 0) return "(aucun noeud d'entree)";

  return inputNodeDatas
    .map((nd) => {
      const content = makeNodeDataLLMFriendly(nd);
      return `### Input: ${nd.type} (ID: ${nd._id})\n${content}`;
    })
    .join("\n\n");
}
