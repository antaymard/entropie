import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { generateLlmId } from "../../lib/llmId";

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
const ERROR_TABLE_SCHEMA_EMPTY =
  "Error: Table schema is empty. Use table_update_schema first (operation: set or add_column) before inserting rows.";

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

const rowInputSchema = z
  .record(z.string(), cellValueSchema)
  .refine((row) => Object.keys(row).length > 0, {
    message: "Each row must contain at least one column value.",
  })
  .describe(
    'A single row to insert as an object map: { "Column Name": value, ... }.',
  );

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

export default function tableInsertRowsTool({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  return createTool({
    description: "Insert one or multiple rows in a table node.",
    args: z.object({
      nodeId: z.string().describe("The node ID in the current canvas."),
      anchorRowId: z
        .string()
        .optional()
        .describe(
          "Row id after which new rows are inserted. If empty or omitted, insert at table start.",
        ),
      valuesJson: z
        .string()
        .describe(
          'Rows to insert as JSON string of compact objects. Example: `[{"":"FloatingText","Couleur démo":"Purple"},{"Type":"Document","Couleur démo":"Blue"}]`.',
        ),
      explanation: z.string().describe("3-5 words explaining the edit intent."),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(
        `🧮 Table row insert requested on node ${args.nodeId}, anchor ${args.anchorRowId ?? "<start>"}`,
      );

      try {
        const { nodeId } = args;
        const anchorRowId = args.anchorRowId?.trim() ?? "";

        let parsedValues: unknown;
        try {
          parsedValues = JSON.parse(args.valuesJson);
        } catch {
          return "Error: valuesJson must be valid JSON.";
        }

        const valuesResult = z
          .array(rowInputSchema)
          .min(1)
          .safeParse(parsedValues);
        if (!valuesResult.success) {
          return `Error: Invalid valuesJson format. ${valuesResult.error.issues
            .map((issue) => issue.message)
            .join(" ")}`;
        }
        const values = valuesResult.data;

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

        if (columns.length === 0) {
          return ERROR_TABLE_SCHEMA_EMPTY;
        }

        let insertIndex = 0;
        if (anchorRowId.length > 0) {
          const anchorMatches = rows.filter(
            (row) => (row.id ?? "").trim() === anchorRowId,
          );

          if (anchorMatches.length === 0) {
            return `Error: No match found for anchorRowId "${args.anchorRowId}".`;
          }
          if (anchorMatches.length > 1) {
            return `Error: Found ${anchorMatches.length} matches for anchorRowId "${args.anchorRowId}". Please provide a unique rowId.`;
          }

          const anchorIdx = rows.findIndex(
            (row) => (row.id ?? "").trim() === anchorRowId,
          );
          insertIndex = anchorIdx + 1;
        }

        const rowsToInsert: Array<TableRow> = [];

        for (const rowInput of values) {
          const resolvedUpdates: Array<{ columnId: string; value: unknown }> =
            [];

          for (const [columnInput, rawValue] of Object.entries(rowInput)) {
            const updateColumnNormalized = normalizeLookupKey(columnInput);
            const updateColumnNoSpaces = removeSpaces(updateColumnNormalized);

            const matchedColumns = columns.filter(
              (column) =>
                column.id === columnInput ||
                normalizeLookupKey(column.id) === updateColumnNormalized ||
                normalizeLookupKey(column.name) === updateColumnNormalized ||
                removeSpaces(normalizeLookupKey(column.id)) ===
                  updateColumnNoSpaces ||
                removeSpaces(normalizeLookupKey(column.name)) ===
                  updateColumnNoSpaces,
            );

            if (matchedColumns.length === 0) {
              return `Error: No match found for column "${columnInput}".`;
            }
            if (matchedColumns.length > 1) {
              return `Error: Found ${matchedColumns.length} matches for column "${columnInput}". Please provide a unique column id.`;
            }

            const matchedColumn = matchedColumns[0];

            const duplicate = resolvedUpdates.some(
              (existing) => existing.columnId === matchedColumn.id,
            );
            if (duplicate) {
              return `Error: Column "${matchedColumn.name}" is provided multiple times.`;
            }

            const normalized = normalizeCellValueForColumn({
              rawValue,
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

          const nextCells: Record<string, unknown> = {};
          for (const update of resolvedUpdates) {
            nextCells[update.columnId] = update.value;
          }

          rowsToInsert.push({
            id: generateLlmId(),
            cells: nextCells,
          });
        }

        const updatedRows = [
          ...rows.slice(0, insertIndex),
          ...rowsToInsert,
          ...rows.slice(insertIndex),
        ];

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
          `✅ Table row insert complete for node ${nodeId} (${rowsToInsert.length} row(s))`,
        );

        return `Successfully added ${rowsToInsert.length} rows.`;
      } catch (error) {
        console.error("Table insert rows tool error:", error);
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
}
