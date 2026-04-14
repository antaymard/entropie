import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { toolAgentNames, type ThreadCtx } from "../agentConfig";
import { internal } from "../../_generated/api";
import { generateLlmId } from "../../lib/llmId";
import { ToolConfig, toolError } from "./toolHelpers";

// Tool compaction config
export const tableUpdateSchemaToolConfig: ToolConfig = {
  name: "table_update_schema",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
    toolAgentNames.worker,
  ],
};

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

const ERROR_TARGET_NOT_TABLE = toolError("Target node must be a table.");
const ERROR_INVALID_TABLE_CONTENT = toolError(
  "Table content is not valid (expected table.columns and table.rows arrays).",
);

const columnTypeSchema = z.enum(["text", "number", "checkbox", "date", "link"]);

const columnInputSchema = z.object({
  id: z
    .string()
    .min(1)
    .optional()
    .describe("Optional column id. If omitted, one is generated."),
  name: z.string().min(1).describe("Column display name."),
  type: columnTypeSchema.describe("Column type."),
});

const operationSchema = z.enum(["set", "add_column", "delete_column"]);

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase();
}

function removeSpaces(value: string): string {
  return value.replace(/\s+/g, "");
}

function buildColumnId(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (normalized.length > 0) {
    return normalized;
  }

  return generateLlmId();
}

function resolveColumnMatches({
  columns,
  identifier,
}: {
  columns: Array<TableColumn>;
  identifier: string;
}): Array<TableColumn> {
  const normalized = normalizeLookupKey(identifier);
  const noSpaces = removeSpaces(normalized);

  return columns.filter(
    (column) =>
      column.id === identifier ||
      normalizeLookupKey(column.id) === normalized ||
      normalizeLookupKey(column.name) === normalized ||
      removeSpaces(normalizeLookupKey(column.id)) === noSpaces ||
      removeSpaces(normalizeLookupKey(column.name)) === noSpaces,
  );
}

function validateNoDuplicateColumns(
  columns: Array<TableColumn>,
): string | null {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (const column of columns) {
    const normalizedId = normalizeLookupKey(column.id);
    const normalizedName = normalizeLookupKey(column.name);

    if (seenIds.has(normalizedId)) {
      return toolError(`Duplicate column id "${column.id}".`);
    }
    if (seenNames.has(normalizedName)) {
      return toolError(`Duplicate column name "${column.name}".`);
    }

    seenIds.add(normalizedId);
    seenNames.add(normalizedName);
  }

  return null;
}

export default function tableUpdateSchemaTool({
  threadCtx,
}: {
  threadCtx: ThreadCtx;
}) {
  const { canvasId } = threadCtx;

  return createTool({
    description:
      "Update table schema (columns) on a table node: initialize, add columns, or delete columns.",
    args: z.object({
      nodeId: z.string().describe("The node ID in the current canvas."),
      operation: operationSchema.describe(
        "Operation to apply: set (only when schema is empty), add_column, or delete_column.",
      ),
      deleteColumnsValues: z
        .boolean()
        .optional()
        .describe(
          "For delete_column only. If true, remove deleted columns values from all rows. If false, deletion is blocked when values exist.",
        ),
      payload: z
        .object({
          columns: z
            .array(columnInputSchema)
            .optional()
            .describe("For set: full schema columns list."),
          column: columnInputSchema
            .optional()
            .describe("For add_column: one column to add."),
          columnIdentifiers: z
            .array(z.string().min(1))
            .optional()
            .describe("For delete_column: column id(s) or name(s) to delete."),
        })
        .describe("Operation payload."),
      explanation: z.string().describe("3-5 words explaining the edit intent."),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(
        `🧮 Table schema update requested on node ${args.nodeId} (${args.operation})`,
      );

      try {
        const { node, nodeData } = await ctx.runQuery(
          internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
          {
            canvasId,
            nodeId: args.nodeId,
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

        if (args.operation === "set") {
          const inputColumns = args.payload.columns;
          if (!inputColumns || inputColumns.length === 0) {
            return toolError(
              "payload.columns is required for set and must contain at least one column.",
            );
          }

          if (columns.length > 0) {
            return toolError("set is allowed only when table schema is empty.");
          }

          if (rows.length > 0) {
            return toolError(
              "set is allowed only when table schema is empty (no columns and no rows).",
            );
          }

          const nextColumns: Array<TableColumn> = inputColumns.map(
            (column) => ({
              id: column.id?.trim() || buildColumnId(column.name),
              name: column.name.trim(),
              type: column.type,
            }),
          );

          const duplicatesError = validateNoDuplicateColumns(nextColumns);
          if (duplicatesError) {
            return duplicatesError;
          }

          await ctx.runMutation(
            internal.wrappers.nodeDataWrappers.updateValues,
            {
              _id: nodeData._id,
              values: {
                ...nodeData.values,
                table: {
                  ...tableValue,
                  columns: nextColumns,
                  rows,
                },
              },
            },
          );

          return `Successfully set table schema with ${nextColumns.length} columns.`;
        }

        if (args.operation === "add_column") {
          const inputColumn = args.payload.column;
          if (!inputColumn) {
            return toolError("payload.column is required for add_column.");
          }

          const nextColumn: TableColumn = {
            id: inputColumn.id?.trim() || buildColumnId(inputColumn.name),
            name: inputColumn.name.trim(),
            type: inputColumn.type,
          };

          const nextColumns = [...columns, nextColumn];
          const duplicatesError = validateNoDuplicateColumns(nextColumns);
          if (duplicatesError) {
            return duplicatesError;
          }

          await ctx.runMutation(
            internal.wrappers.nodeDataWrappers.updateValues,
            {
              _id: nodeData._id,
              values: {
                ...nodeData.values,
                table: {
                  ...tableValue,
                  columns: nextColumns,
                  rows,
                },
              },
            },
          );

          return `Successfully added column "${nextColumn.name}".`;
        }

        const identifiers = args.payload.columnIdentifiers;
        if (!identifiers || identifiers.length === 0) {
          return toolError(
            "payload.columnIdentifiers is required for delete_column.",
          );
        }

        const resolvedColumnIds: Array<string> = [];
        const resolvedColumns: Array<TableColumn> = [];

        for (const identifier of identifiers) {
          const matches = resolveColumnMatches({
            columns,
            identifier,
          });

          if (matches.length === 0) {
            return toolError(`No match found for column "${identifier}".`);
          }
          if (matches.length > 1) {
            return toolError(
              `Found ${matches.length} matches for column "${identifier}". Please use a unique id.`,
            );
          }

          const matchedColumn = matches[0];
          if (resolvedColumnIds.includes(matchedColumn.id)) {
            return toolError(
              `Column "${matchedColumn.name}" is provided multiple times.`,
            );
          }

          resolvedColumnIds.push(matchedColumn.id);
          resolvedColumns.push(matchedColumn);
        }

        const shouldDeleteValues = args.deleteColumnsValues ?? false;
        const idsToDelete = new Set(resolvedColumnIds);

        const rowsWithValues = rows.filter((row) => {
          const rowCells = row.cells ?? {};
          return [...idsToDelete].some(
            (columnId) => rowCells[columnId] !== undefined,
          );
        });

        if (!shouldDeleteValues && rowsWithValues.length > 0) {
          return toolError(
            "Some rows contain values for columns to delete. Set deleteColumnsValues=true to remove these values.",
          );
        }

        const nextColumns = columns.filter(
          (column) => !idsToDelete.has(column.id),
        );

        const nextRows =
          shouldDeleteValues && rowsWithValues.length > 0
            ? rows.map((row) => {
                const rowCells = { ...(row.cells ?? {}) };
                for (const columnId of idsToDelete) {
                  delete rowCells[columnId];
                }

                return {
                  ...row,
                  cells: rowCells,
                };
              })
            : rows;

        await ctx.runMutation(internal.wrappers.nodeDataWrappers.updateValues, {
          _id: nodeData._id,
          values: {
            ...nodeData.values,
            table: {
              ...tableValue,
              columns: nextColumns,
              rows: nextRows,
            },
          },
        });

        return `Successfully deleted ${resolvedColumns.length} column(s).`;
      } catch (error) {
        console.error("Table update schema tool error:", error);
        return toolError(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
  });
}
