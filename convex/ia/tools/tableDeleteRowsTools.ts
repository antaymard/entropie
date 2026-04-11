import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

type TableRow = {
  id: string;
  cells?: Record<string, unknown>;
};

type StoredTableValue = {
  columns?: Array<unknown>;
  rows?: Array<TableRow>;
};

const ERROR_TARGET_NOT_TABLE = "Error: Target node must be a table.";
const ERROR_INVALID_TABLE_CONTENT =
  "Error: Table content is not valid (expected table.columns and table.rows arrays).";
const ERROR_TABLE_SCHEMA_EMPTY =
  "Error: Table schema is empty. Use table_update_schema first (operation: set or add_column) before deleting rows.";

function normalizeRowId(value: string): string {
  return value.trim();
}

export default function tableDeleteRowsTool({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  return createTool({
    description:
      "Delete one or multiple rows from a table node in the current canvas.",
    args: z.object({
      nodeId: z.string().describe("The node ID in the current canvas."),
      rowIds: z
        .array(z.string().min(1))
        .min(1)
        .describe(
          "List of table row IDs to delete (from _rowId in read_nodes).",
        ),
      explanation: z.string().describe("3-5 words explaining the edit intent."),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(
        `🧮 Table row delete requested on node ${args.nodeId} for ${args.rowIds.length} row id(s)`,
      );

      try {
        const { nodeId, rowIds } = args;
        const normalizedRowIds = rowIds.map(normalizeRowId);

        const duplicateInput = normalizedRowIds.find(
          (id, index) => normalizedRowIds.indexOf(id) !== index,
        );
        if (duplicateInput) {
          return `Error: rowId "${duplicateInput}" is provided multiple times.`;
        }

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

        for (const rawRowId of rowIds) {
          const wantedId = normalizeRowId(rawRowId);
          const matches = rows.filter(
            (row) => normalizeRowId(row.id ?? "") === wantedId,
          );

          if (matches.length === 0) {
            return `Error: No match found for rowId "${rawRowId}".`;
          }
          if (matches.length > 1) {
            return `Error: Found ${matches.length} matches for rowId "${rawRowId}". Please provide a unique rowId.`;
          }
        }

        const idsToDelete = new Set(normalizedRowIds);
        const updatedRows = rows.filter(
          (row) => !idsToDelete.has(normalizeRowId(row.id ?? "")),
        );

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
          `✅ Table row delete complete for node ${nodeId} (${normalizedRowIds.length} row(s))`,
        );

        return `Successfully deleted ${normalizedRowIds.length} row.`;
      } catch (error) {
        console.error("Table delete rows tool error:", error);
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
}
