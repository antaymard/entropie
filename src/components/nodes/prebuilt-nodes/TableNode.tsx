import { memo, useCallback } from "react";
import type { Node } from "@xyflow/react";
import { areNodePropsEqual } from "../areNodePropsEqual";
import { useNodeDataValues } from "@/hooks/useNodeData";
import type { Id } from "@/../convex/_generated/dataModel";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import { Button } from "@/components/shadcn/button";
import { TbMaximize } from "react-icons/tb";
import { useWindowsStore } from "@/stores/windowsStore";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

type ColumnType = "text" | "number" | "checkbox";

interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
}

interface TableRowData {
  id: string;
  cells: Record<string, string | number | boolean | null>;
}

interface TableData {
  columns: TableColumn[];
  rows: TableRowData[];
}

function renderCellValue(
  value: string | number | boolean | null | undefined,
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
          <table className="w-full caption-bottom text-sm">
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
        </div>
      </NodeFrame>
    </>
  );
}

export default memo(TableNode, areNodePropsEqual);
