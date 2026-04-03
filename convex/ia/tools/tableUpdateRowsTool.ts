import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

type TableColumnType = "text" | "number" | "checkbox" | "date" | "link";

type TableColumn = {
  id: string;
  name: string;
  type: TableColumnType;
};

type TableRow = {
  id: string;
  cells?: Record<string, unknown>;
};

type StoredTableValue = {
  columns?: Array<TableColumn>;
  rows?: Array<TableRow>;
};

const ERROR_TARGET_NOT_TABLE = "Error: Target node must be a table.";
const ERROR_INVALID_TABLE_CONTENT =
  "Error: Table content is not valid (expected table.columns and table.rows arrays).";

const linkValueSchema = z.object({
  href: z.string().min(1),
  pageTitle: z.string().optional(),
  pageImage: z.string().optional(),
  pageDescription: z.string().optional(),
});

const cellValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  linkValueSchema,
]);

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase();
}

function removeSpaces(value: string): string {
  return value.replace(/\s+/g, "");
}

function normalizeCellValueForColumn({
  rawValue,
  column,
}: {
  rawValue: z.infer<typeof cellValueSchema>;
  column: TableColumn;
}): { ok: true; value: unknown } | { ok: false; error: string } {
  switch (column.type) {
    case "text":
    case "date": {
      if (typeof rawValue !== "string") {
        return {
          ok: false,
          error: `Error: Invalid value for column "${column.name}" (type ${column.type}). Expected a string.`,
        };
      }
      return { ok: true, value: rawValue };
    }

    case "number": {
      if (typeof rawValue === "number") {
        return { ok: true, value: rawValue };
      }
      if (typeof rawValue === "string") {
        const trimmed = rawValue.trim();
        const parsed = Number(trimmed);
        if (trimmed.length > 0 && Number.isFinite(parsed)) {
          return { ok: true, value: parsed };
        }
      }
      return {
        ok: false,
        error: `Error: Invalid value for column "${column.name}" (type number). Expected a number or numeric string.`,
      };
    }

    case "checkbox": {
      if (typeof rawValue === "boolean") {
        return { ok: true, value: rawValue };
      }
      if (typeof rawValue === "string") {
        const normalized = rawValue.trim().toLowerCase();
        if (normalized === "true") return { ok: true, value: true };
        if (normalized === "false") return { ok: true, value: false };
      }
      return {
        ok: false,
        error: `Error: Invalid value for column "${column.name}" (type checkbox). Expected true/false.`,
      };
    }

    case "link": {
      if (typeof rawValue === "string") {
        const href = rawValue.trim();
        if (!href) {
          return {
            ok: false,
            error: `Error: Invalid value for column "${column.name}" (type link). Expected a URL string or a link object with href.`,
          };
        }
        return {
          ok: true,
          value: {
            href,
            pageTitle: href,
          },
        };
      }

      const parsed = linkValueSchema.safeParse(rawValue);
      if (parsed.success) {
        return {
          ok: true,
          value: {
            href: parsed.data.href,
            pageTitle: parsed.data.pageTitle ?? parsed.data.href,
            pageImage: parsed.data.pageImage,
            pageDescription: parsed.data.pageDescription,
          },
        };
      }

      return {
        ok: false,
        error: `Error: Invalid value for column "${column.name}" (type link). Expected a URL string or an object { href, pageTitle? } .`,
      };
    }

    default: {
      return {
        ok: false,
        error: `Error: Unsupported column type for "${column.name}".`,
      };
    }
  }
}

export default function tableUpdateRowsTool({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  return createTool({
    description:
      "Update one existing row in a table node from the current canvas.",
    args: z.object({
      nodeId: z.string().describe("The node ID in the current canvas."),
      rowId: z
        .string()
        .min(1)
        .describe("The table row ID to update (from _rowId in read_nodes)."),
      values: z
        .array(
          z.object({
            column: z
              .string()
              .min(1)
              .describe("Column title or id from the table markdown header."),
            newValue: cellValueSchema.describe("New value for this column."),
          }),
        )
        .min(1)
        .describe("Column updates to apply on the target row."),
      explanation: z.string().describe("3-5 words explaining the edit intent."),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(
        `🧮 Table row update requested on node ${args.nodeId}, row ${args.rowId}`,
      );

      try {
        const { nodeId, rowId, values } = args;
        const normalizedRowId = rowId.trim();

        const { node, nodeData } = await ctx.runQuery(
          internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
          {
            canvasId,
            nodeId,
          },
        );

        if (node.type !== "table" || nodeData.type !== "table") {
          return ERROR_TARGET_NOT_TABLE;
        }

        const tableValue = (nodeData.values.table ?? {}) as StoredTableValue;
        const columns = Array.isArray(tableValue.columns)
          ? tableValue.columns
          : null;
        const rows = Array.isArray(tableValue.rows) ? tableValue.rows : null;

        if (!columns || !rows) {
          return ERROR_INVALID_TABLE_CONTENT;
        }

        const rowMatches = rows.filter(
          (row) => (row.id ?? "").trim() === normalizedRowId,
        );
        if (rowMatches.length === 0) {
          return `Error: No match found for rowId "${rowId}".`;
        }
        if (rowMatches.length > 1) {
          return `Error: Found ${rowMatches.length} matches for rowId "${rowId}". Please provide a unique rowId.`;
        }

        const resolvedUpdates: Array<{ columnId: string; value: unknown }> = [];

        for (const update of values) {
          const updateColumnNormalized = normalizeLookupKey(update.column);
          const updateColumnNoSpaces = removeSpaces(updateColumnNormalized);

          const matchedColumns = columns.filter(
            (column) =>
              column.id === update.column ||
              normalizeLookupKey(column.id) === updateColumnNormalized ||
              normalizeLookupKey(column.name) === updateColumnNormalized ||
              removeSpaces(normalizeLookupKey(column.id)) ===
                updateColumnNoSpaces ||
              removeSpaces(normalizeLookupKey(column.name)) ===
                updateColumnNoSpaces,
          );

          if (matchedColumns.length === 0) {
            return `Error: No match found for column "${update.column}".`;
          }
          if (matchedColumns.length > 1) {
            return `Error: Found ${matchedColumns.length} matches for column "${update.column}". Please provide a unique column id.`;
          }

          const matchedColumn = matchedColumns[0];

          const duplicate = resolvedUpdates.some(
            (existing) => existing.columnId === matchedColumn.id,
          );
          if (duplicate) {
            return `Error: Column "${matchedColumn.name}" is provided multiple times.`;
          }

          const normalized = normalizeCellValueForColumn({
            rawValue: update.newValue,
            column: matchedColumn,
          });
          if (!normalized.ok) {
            return normalized.error;
          }

          resolvedUpdates.push({
            columnId: matchedColumn.id,
            value: normalized.value,
          });
        }

        const updatedRows = rows.map((row) => {
          if ((row.id ?? "").trim() !== normalizedRowId) {
            return row;
          }

          const nextCells: Record<string, unknown> = {
            ...(row.cells ?? {}),
          };

          for (const update of resolvedUpdates) {
            nextCells[update.columnId] = update.value;
          }

          return {
            ...row,
            cells: nextCells,
          };
        });

        await ctx.runMutation(internal.wrappers.nodeDataWrappers.updateValues, {
          _id: nodeData._id,
          values: {
            ...nodeData.values,
            table: {
              ...tableValue,
              columns,
              rows: updatedRows,
            },
          },
        });

        console.log(
          `✅ Table row update complete for node ${nodeId}, row ${rowId} (${resolvedUpdates.length} column(s))`,
        );

        return `Successfully replaced row in exactly ${resolvedUpdates.length} colunms.`;
      } catch (error) {
        console.error("Table update rows tool error:", error);
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
}
