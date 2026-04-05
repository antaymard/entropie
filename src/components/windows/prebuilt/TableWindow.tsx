import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNodeData, useNodeDataValues } from "@/hooks/useNodeData";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import type { Id } from "@/../convex/_generated/dataModel";
import { useWindowFrameContext } from "@/components/windows/WindowFrameContext";
import InlineEditableText from "@/components/form-ui/InlineEditableText";
import { Table } from "@/components/table";
import type { TableData, TableColumn, TableRowData, CellValue, ColumnType } from "@/components/table";

function TableWindow({ nodeDataId }: { nodeDataId: Id<"nodeDatas"> }) {
  const { setDirty, setSaveHandler } = useWindowFrameContext();
  const nodeData = useNodeData(nodeDataId);
  const nodeDataValues = useNodeDataValues(nodeDataId);
  const { updateNodeDataValues } = useUpdateNodeDataValues();
  const isLocked = nodeData?.status === "working";

  const initialData = useMemo(() => {
    return (
      (nodeDataValues?.table as TableData | undefined) ?? {
        columns: [],
        rows: [],
      }
    );
    // Only initialize on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialTitle = useMemo(() => {
    return (nodeDataValues?.title as string | undefined) ?? "";
    // Only initialize on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [localColumns, setLocalColumns] = useState<TableColumn[]>(
    initialData.columns,
  );
  const [localRows, setLocalRows] = useState<TableRowData[]>(initialData.rows);
  const [localTitle, setLocalTitle] = useState<string>(initialTitle);
  const [isDirty, setIsDirty] = useState(false);

  // Keep latest refs to avoid stale closures in save handler
  const columnsRef = useRef(localColumns);
  const rowsRef = useRef(localRows);
  const titleRef = useRef(localTitle);
  useEffect(() => {
    columnsRef.current = localColumns;
  }, [localColumns]);
  useEffect(() => {
    rowsRef.current = localRows;
  }, [localRows]);
  useEffect(() => {
    titleRef.current = localTitle;
  }, [localTitle]);

  useEffect(() => {
    setDirty(isDirty && !isLocked);
  }, [isDirty, isLocked, setDirty]);

  const handleSave = useCallback(() => {
    updateNodeDataValues({
      nodeDataId,
      values: {
        title: titleRef.current,
        table: { columns: columnsRef.current, rows: rowsRef.current },
      },
    });
    setIsDirty(false);
  }, [nodeDataId, updateNodeDataValues]);

  useEffect(() => {
    setSaveHandler(() => handleSave);
    return () => setSaveHandler(null);
  }, [handleSave, setSaveHandler]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  // --- Column management ---

  const addColumn = useCallback(() => {
    const newCol: TableColumn = {
      id: crypto.randomUUID(),
      name: `Column ${columnsRef.current.length + 1}`,
      type: "text",
    };
    setLocalColumns((cols) => [...cols, newCol]);
    setLocalRows((rows) =>
      rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [newCol.id]: null },
      })),
    );
    markDirty();
  }, [markDirty]);

  const deleteColumn = useCallback(
    (colId: string) => {
      setLocalColumns((cols) => cols.filter((c) => c.id !== colId));
      setLocalRows((rows) =>
        rows.map((row) => {
          const newCells = { ...row.cells };
          delete newCells[colId];
          return { ...row, cells: newCells };
        }),
      );
      markDirty();
    },
    [markDirty],
  );

  const updateColumnName = useCallback(
    (colId: string, name: string) => {
      setLocalColumns((cols) =>
        cols.map((c) => (c.id === colId ? { ...c, name } : c)),
      );
      markDirty();
    },
    [markDirty],
  );

  const updateColumnType = useCallback(
    (colId: string, type: ColumnType) => {
      setLocalColumns((cols) =>
        cols.map((c) => (c.id === colId ? { ...c, type } : c)),
      );
      setLocalRows((rows) =>
        rows.map((row) => ({
          ...row,
          cells: { ...row.cells, [colId]: null },
        })),
      );
      markDirty();
    },
    [markDirty],
  );

  // --- Row management ---

  const addRow = useCallback(() => {
    const newRow: TableRowData = {
      id: crypto.randomUUID(),
      cells: Object.fromEntries(
        columnsRef.current.map((col) => [col.id, null]),
      ),
    };
    setLocalRows((rows) => [...rows, newRow]);
    markDirty();
  }, [markDirty]);

  const deleteRow = useCallback(
    (rowId: string) => {
      setLocalRows((rows) => rows.filter((r) => r.id !== rowId));
      markDirty();
    },
    [markDirty],
  );

  const updateCell = useCallback(
    (rowId: string, colId: string, value: CellValue) => {
      setLocalRows((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? { ...row, cells: { ...row.cells, [colId]: value } }
            : row,
        ),
      );
      markDirty();
    },
    [markDirty],
  );

  if (!nodeDataValues) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b shrink-0">
        <InlineEditableText
          value={localTitle}
          onSave={(val) => {
            setLocalTitle(val);
            markDirty();
          }}
          placeholder="Sans titre"
          className="font-semibold text-lg min-w-0 flex-1"
          disabled={isLocked}
        />
      </div>
      <Table
        columns={localColumns}
        rows={localRows}
        readOnly={isLocked}
        onCellChange={updateCell}
        onAddRow={addRow}
        onDeleteRow={deleteRow}
        onAddColumn={addColumn}
        onDeleteColumn={deleteColumn}
        onColumnNameChange={updateColumnName}
        onColumnTypeChange={updateColumnType}
        className="flex-1 min-h-0"
      />
    </div>
  );
}

export default memo(TableWindow, (prev, next) => prev.nodeDataId === next.nodeDataId);
