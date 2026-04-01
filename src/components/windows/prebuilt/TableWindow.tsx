import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNodeData, useNodeDataValues } from "@/hooks/useNodeData";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import type { Id } from "@/../convex/_generated/dataModel";
import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import toast from "react-hot-toast";
import { useWindowFrameContext } from "@/components/windows/WindowFrameContext";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { TbPlus, TbTrash, TbChevronDown, TbCalendar, TbLink } from "react-icons/tb";
import { Calendar } from "@/components/shadcn/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { cn } from "@/lib/utils";

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

interface EditingCell {
  rowId: string;
  columnId: string;
}

const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: "Text",
  number: "Number",
  checkbox: "Checkbox",
  date: "Date",
  link: "Link",
};

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

  const [localColumns, setLocalColumns] = useState<TableColumn[]>(
    initialData.columns,
  );
  const [localRows, setLocalRows] = useState<TableRowData[]>(initialData.rows);
  const [isDirty, setIsDirty] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const tableRootRef = useRef<HTMLDivElement>(null);

  // Keep latest refs to avoid stale closures in save handler
  const columnsRef = useRef(localColumns);
  const rowsRef = useRef(localRows);
  useEffect(() => {
    columnsRef.current = localColumns;
  }, [localColumns]);
  useEffect(() => {
    rowsRef.current = localRows;
  }, [localRows]);

  useEffect(() => {
    setDirty(isDirty && !isLocked);
  }, [isDirty, isLocked, setDirty]);

  const handleSave = useCallback(() => {
    updateNodeDataValues({
      nodeDataId,
      values: {
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

  // --- Tanstack table ---

  const columns = useMemo<ColumnDef<TableRowData>[]>(
    () => [
      ...localColumns.map(
        (col): ColumnDef<TableRowData> => ({
          id: col.id,
          accessorFn: (row) => row.cells[col.id],
          header: () => (
            <ColHeader
              col={col}
              isEditing={editingColumnId === col.id}
              onEditStart={() => !isLocked && setEditingColumnId(col.id)}
              onEditEnd={() => {
                setEditingColumnId(null);
                tableRootRef.current?.focus();
              }}
              onNameChange={(name) => updateColumnName(col.id, name)}
              onTypeChange={(type) => updateColumnType(col.id, type)}
              onDelete={() => deleteColumn(col.id)}
              disabled={isLocked}
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
                disabled={isLocked}
                onClick={() => {
                  if (isLocked) return;
                  if (col.type === "checkbox") {
                    updateCell(row.original.id, col.id, !value);
                  } else {
                    setEditingCell({
                      rowId: row.original.id,
                      columnId: col.id,
                    });
                  }
                }}
                onChange={(val) => updateCell(row.original.id, col.id, val)}
                onBlur={() => {
                  setEditingCell(null);
                  tableRootRef.current?.focus();
                }}
              />
            );
          },
        }),
      ),
      {
        id: "__delete__",
        header: () => null,
        cell: ({ row }) => (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover/tablerow:opacity-100"
            onClick={() => deleteRow(row.original.id)}
            disabled={isLocked}
          >
            <TbTrash size={13} />
          </Button>
        ),
      },
    ],
    [
      localColumns,
      editingCell,
      editingColumnId,
      isLocked,
      updateCell,
      updateColumnName,
      updateColumnType,
      deleteColumn,
      deleteRow,
    ],
  );

  const table = useReactTable({
    data: localRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (!nodeDataValues) return null;

  return (
    <div ref={tableRootRef} tabIndex={-1} className="flex flex-col h-full outline-none">
      <div className="flex gap-2 p-2 border-b shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={addColumn}
          disabled={isLocked}
        >
          <TbPlus size={14} className="mr-1" />
          Add column
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={addRow}
          disabled={isLocked}
        >
          <TbPlus size={14} className="mr-1" />
          Add row
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <Table>
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
                  colSpan={localColumns.length + 1}
                  className="text-center text-muted-foreground py-10"
                >
                  No rows yet. Click "Add row" to get started.
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
        </Table>
      </div>
    </div>
  );
}

// ── ColHeader ────────────────────────────────────────────────────────────────

interface ColHeaderProps {
  col: TableColumn;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onNameChange: (name: string) => void;
  onTypeChange: (type: ColumnType) => void;
  onDelete: () => void;
  disabled: boolean;
}

function ColHeader({
  col,
  isEditing,
  onEditStart,
  onEditEnd,
  onNameChange,
  onDelete,
  onTypeChange,
  disabled,
}: ColHeaderProps) {
  return (
    <div className="flex items-center gap-1 group/colheader min-w-0">
      {isEditing ? (
        <Input
          autoFocus
          defaultValue={col.name}
          className="h-6 text-xs w-24"
          onBlur={(e) => {
            onNameChange(e.target.value || col.name);
            onEditEnd();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") onEditEnd();
          }}
        />
      ) : (
        <span
          className={cn(
            "truncate text-sm font-medium",
            !disabled && "cursor-pointer hover:underline",
          )}
          onClick={disabled ? undefined : onEditStart}
        >
          {col.name}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 shrink-0 opacity-50 hover:opacity-100"
            disabled={disabled}
          >
            <TbChevronDown size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.entries(COLUMN_TYPE_LABELS) as [ColumnType, string][]).map(
            ([value, label]) => (
              <DropdownMenuItem
                key={value}
                onClick={() => onTypeChange(value)}
                className={cn(col.type === value && "font-semibold")}
              >
                {label}
              </DropdownMenuItem>
            ),
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <TbTrash size={14} className="mr-2" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── CellEditor ───────────────────────────────────────────────────────────────

interface CellEditorProps {
  type: ColumnType;
  value: CellValue | undefined;
  isEditing: boolean;
  disabled: boolean;
  onClick: () => void;
  onChange: (val: CellValue) => void;
  onBlur: () => void;
}

function CellEditor({
  type,
  value,
  isEditing,
  disabled,
  onClick,
  onChange,
  onBlur,
}: CellEditorProps) {
  if (type === "checkbox") {
    return (
      <Checkbox
        checked={!!value}
        onCheckedChange={(checked) => onChange(!!checked)}
        disabled={disabled}
        className="block"
      />
    );
  }

  if (type === "date") {
    const dateValue =
      value != null && value !== "" ? new Date(String(value)) : undefined;
    const displayValue =
      dateValue != null
        ? dateValue.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";

    if (disabled) {
      return (
        <span className="block w-full min-h-[1.4em] text-sm rounded px-1">
          {displayValue}
        </span>
      );
    }

    return (
      <Popover open={isEditing} onOpenChange={(open) => !open && onBlur()}>
        <PopoverTrigger asChild>
          <span
            className={cn(
              "flex items-center gap-1 w-full min-h-[1.4em] text-sm rounded px-1 cursor-pointer hover:bg-muted/50",
            )}
            onClick={onClick}
          >
            <TbCalendar size={13} className="shrink-0 text-muted-foreground" />
            {displayValue || (
              <span className="text-muted-foreground">Pick a date…</span>
            )}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date) {
                const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                onChange(iso);
              } else {
                onChange(null);
              }
              onBlur();
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  if (type === "link") {
    return (
      <LinkCellEditor
        value={value as LinkCellValue | null | undefined}
        isEditing={isEditing}
        disabled={disabled}
        onClick={onClick}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        type={type === "number" ? "number" : "text"}
        defaultValue={value != null ? String(value) : ""}
        className="h-7 text-sm"
        onBlur={(e) => {
          if (type === "number") {
            const num = e.target.value !== "" ? Number(e.target.value) : null;
            onChange(num);
          } else {
            onChange(e.target.value);
          }
          onBlur();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") onBlur();
        }}
      />
    );
  }

  return (
    <span
      className={cn(
        "block w-full min-h-[1.4em] text-sm rounded px-1",
        !disabled && "cursor-text hover:bg-muted/50",
      )}
      onClick={disabled ? undefined : onClick}
    >
      {value != null ? String(value) : ""}
    </span>
  );
}

// ── LinkCellEditor ──────────────────────────────────────────────────────────

interface LinkCellEditorProps {
  value: LinkCellValue | null | undefined;
  isEditing: boolean;
  disabled: boolean;
  onClick: () => void;
  onChange: (val: CellValue) => void;
  onBlur: () => void;
}

function LinkCellEditor({
  value,
  isEditing,
  disabled,
  onClick,
  onChange,
  onBlur,
}: LinkCellEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fetchLinkMetadata = useAction(api.links.fetchLinkMetadata);

  const handleOpen = () => {
    setLinkUrl(value?.href ?? "");
  };

  const handleSave = async () => {
    let url = linkUrl.trim();
    if (!url) {
      onChange(null);
      onBlur();
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    try {
      new URL(url);
    } catch {
      toast.error("URL invalide");
      return;
    }

    setIsLoading(true);
    try {
      const metadata = await fetchLinkMetadata({ url });
      onChange({
        href: url,
        pageTitle: metadata.title || url,
        pageImage: metadata.image || undefined,
        pageDescription: metadata.description || undefined,
      });
    } catch {
      onChange({
        href: url,
        pageTitle: url,
      });
    } finally {
      setIsLoading(false);
      onBlur();
    }
  };

  const linkVal = value as LinkCellValue | null | undefined;
  let displayLabel = "";
  if (linkVal?.href) {
    displayLabel = linkVal.pageTitle;
    if (!displayLabel) {
      try {
        displayLabel = new URL(linkVal.href).hostname.replace(/^www\./, "");
      } catch {
        displayLabel = linkVal.href;
      }
    }
  }

  if (disabled) {
    return (
      <span className="flex items-center gap-1 w-full min-h-[1.4em] text-sm rounded px-1">
        {displayLabel ? (
          <>
            <TbLink size={13} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{displayLabel}</span>
          </>
        ) : null}
      </span>
    );
  }

  return (
    <Popover
      open={isEditing}
      onOpenChange={(open) => {
        if (open) handleOpen();
        if (!open) onBlur();
      }}
    >
      <PopoverTrigger asChild>
        <span
          className={cn(
            "flex items-center gap-1 w-full min-h-[1.4em] text-sm rounded px-1 cursor-pointer hover:bg-muted/50",
          )}
          onClick={onClick}
        >
          {displayLabel ? (
            <>
              <TbLink size={13} className="shrink-0 text-muted-foreground" />
              <a
                href={linkVal!.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {displayLabel}
              </a>
            </>
          ) : (
            <span className="text-muted-foreground">Add a link…</span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
              if (e.key === "Escape") onBlur();
            }}
            disabled={isLoading}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Chargement…" : "Enregistrer"}
            </Button>
            {linkVal?.href && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onChange(null);
                  onBlur();
                }}
              >
                <TbTrash size={14} />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default memo(
  TableWindow,
  (prev, next) =>
    prev.xyNodeId === next.xyNodeId && prev.nodeDataId === next.nodeDataId,
);
