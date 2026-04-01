import { memo, useCallback } from "react";
import type { Node } from "@xyflow/react";
import { areNodePropsEqual } from "../areNodePropsEqual";
import { useNodeDataValues } from "@/hooks/useNodeData";
import type { Id } from "@/../convex/_generated/dataModel";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import { Button } from "@/components/shadcn/button";
import { TbMaximize, TbTable, TbLink } from "react-icons/tb";
import { useWindowsStore } from "@/stores/windowsStore";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

type ColumnType = "text" | "number" | "checkbox" | "date" | "link";

interface LinkCellValue {
  href: string;
  pageTitle: string;
  pageImage?: string;
  pageDescription?: string;
}

type CellValue = string | number | boolean | LinkCellValue | null;

interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
}

interface TableRowData {
  id: string;
  cells: Record<string, CellValue>;
}

interface TableData {
  columns: TableColumn[];
  rows: TableRowData[];
}

function renderCellValue(
  value: CellValue | undefined,
  type: ColumnType,
) {
  if (type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={!!value}
        readOnly
        className="pointer-events-none"
      />
    );
  }
  if (type === "date" && value != null && value !== "") {
    const d = new Date(String(value));
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  if (type === "link" && value != null && typeof value === "object") {
    const linkVal = value as LinkCellValue;
    let displayLabel = linkVal.pageTitle;
    if (!displayLabel) {
      try {
        displayLabel = new URL(linkVal.href).hostname.replace(/^www\./, "");
      } catch {
        displayLabel = linkVal.href;
      }
    }
    return (
      <span className="flex items-center gap-1">
        <TbLink size={13} className="shrink-0 text-muted-foreground" />
        <a
          href={linkVal.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {displayLabel}
        </a>
      </span>
    );
  }
  return value != null ? String(value) : "";
}

function TableNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const openWindow = useWindowsStore((s) => s.openWindow);

  const handleOpenWindow = useCallback(() => {
    if (!nodeDataId) return;
    openWindow({ xyNodeId: xyNode.id, nodeDataId, nodeType: "table" });
  }, [nodeDataId, openWindow, xyNode.id]);

  const tableData = (values?.table as TableData | undefined) ?? {
    columns: [],
    rows: [],
  };
  const title = (values?.title as string | undefined) ?? "";
  const isTableEmpty =
    tableData.columns.length === 0 && tableData.rows.length === 0;

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Button
          size="icon"
          variant="outline"
          disabled={!nodeDataId}
          onClick={handleOpenWindow}
        >
          <TbMaximize />
        </Button>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode}>
        <div className="h-full overflow-auto">
          {title && (
            <p className="px-2 pt-1.5 pb-0.5 font-semibold truncate">{title}</p>
          )}
          {isTableEmpty ? (
            <div className="h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40 select-none pointer-events-none">
              <TbTable size={22} />
              <span className="text-xs">Double-clic pour éditer</span>
            </div>
          ) : (
            <table className="w-full caption-bottom">
              <TableHeader>
                <TableRow>
                  {tableData.columns.map((col) => (
                    <TableHead key={col.id}>{col.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.rows.map((row) => (
                  <TableRow key={row.id}>
                    {tableData.columns.map((col) => (
                      <TableCell key={col.id}>
                        {renderCellValue(row.cells[col.id], col.type)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </table>
          )}
        </div>
      </NodeFrame>
    </>
  );
}

export default memo(TableNode, areNodePropsEqual);
