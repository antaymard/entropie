import { useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { TbPlus, TbSearch, TbTrash } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { CellEditor } from "./CellEditor";
import { ColHeader } from "./ColHeader";
import type {
  CellValue,
  ColumnType,
  LinkCellValue,
  TableColumn,
  TableRowData,
} from "./types";

export interface TableProps {
  columns: TableColumn[];
  rows: TableRowData[];
  readOnly?: boolean;
  onCellChange?: (rowId: string, colId: string, value: CellValue) => void;
  onAddRow?: () => void;
  onDeleteRow?: (rowId: string) => void;
  onAddColumn?: () => void;
  onDeleteColumn?: (colId: string) => void;
  onColumnNameChange?: (colId: string, name: string) => void;
  onColumnTypeChange?: (colId: string, type: ColumnType) => void;
  className?: string;
}

interface EditingCell {
  rowId: string;
  columnId: string;
}

const globalFilterFn: FilterFn<TableRowData> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (value == null) return false;
  if (typeof value === "object" && "href" in (value as object)) {
    const link = value as LinkCellValue;
    const term = (filterValue as string).toLowerCase();
    return (
      (link.pageTitle?.toLowerCase().includes(term) ?? false) ||
      (link.href?.toLowerCase().includes(term) ?? false)
    );
  }
  return String(value)
    .toLowerCase()
    .includes((filterValue as string).toLowerCase());
};

export function Table({
  columns: tableColumns,
  rows,
  readOnly = false,
  onCellChange,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn,
  onColumnNameChange,
  onColumnTypeChange,
  className,
}: TableProps) {
  const tableRootRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<TableRowData>[]>(
    () => [
      ...tableColumns.map(
        (col): ColumnDef<TableRowData> => ({
          id: col.id,
          accessorFn: (row) => row.cells[col.id],
          header: ({ column: tanstackCol }) => (
            <ColHeader
              col={col}
              tanstackCol={tanstackCol}
              isEditing={editingColumnId === col.id}
              readOnly={readOnly}
              onEditStart={() => setEditingColumnId(col.id)}
              onEditEnd={() => {
                setEditingColumnId(null);
                tableRootRef.current?.focus();
              }}
              onNameChange={(name) => onColumnNameChange?.(col.id, name)}
              onTypeChange={(type) => onColumnTypeChange?.(col.id, type)}
              onDelete={() => onDeleteColumn?.(col.id)}
            />
          ),
          cell: ({ row }) => {
            const isEditing =
              editingCell?.rowId === row.original.id &&
              editingCell?.columnId === col.id;
            const value = row.original.cells[col.id];
            return (
              <CellEditor
                type={col.type}
                value={value}
                isEditing={isEditing}
                readOnly={readOnly}
                onClick={() => {
                  if (readOnly) return;
                  if (col.type === "checkbox") {
                    onCellChange?.(row.original.id, col.id, !value);
                  } else {
                    setEditingCell({
                      rowId: row.original.id,
                      columnId: col.id,
                    });
                  }
                }}
                onChange={(val) => onCellChange?.(row.original.id, col.id, val)}
                onBlur={() => {
                  setEditingCell(null);
                  tableRootRef.current?.focus();
                }}
              />
            );
          },
        }),
      ),
      ...(!readOnly
        ? [
            {
              id: "__delete__",
              enableSorting: false,
              enableGlobalFilter: false,
              header: () => null,
              cell: ({ row }: { row: { original: TableRowData } }) => (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover/tablerow:opacity-100"
                  onClick={() => onDeleteRow?.(row.original.id)}
                >
                  <TbTrash size={13} />
                </Button>
              ),
            } satisfies ColumnDef<TableRowData>,
          ]
        : []),
    ],
    [
      tableColumns,
      editingCell,
      editingColumnId,
      readOnly,
      onCellChange,
      onColumnNameChange,
      onColumnTypeChange,
      onDeleteColumn,
      onDeleteRow,
    ],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    state: { sorting, globalFilter },
  });

  return (
    <div
      ref={tableRootRef}
      tabIndex={-1}
      className={cn("flex flex-col outline-none", className)}
    >
      {!readOnly && (
        <div className="flex items-center justify-end gap-2 p-2 border-b shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onAddColumn}
          >
            <TbPlus size={14} className="mr-1" />
            Add column
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddRow}
          >
            <TbPlus size={14} className="mr-1" />
            Add row
          </Button>
        </div>
      )}
      {tableColumns.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 border-b shrink-0">
          <TbSearch size={14} className="text-muted-foreground shrink-0" />
          <Input
            placeholder="Search…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-7 text-sm"
          />
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <ShadcnTable>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length + (readOnly ? 0 : 1)}
                  className="text-center text-muted-foreground py-10"
                >
                  {readOnly
                    ? "No rows."
                    : 'No rows yet. Click "Add row" to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="group/tablerow">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadcnTable>
      </div>
    </div>
  );
}
