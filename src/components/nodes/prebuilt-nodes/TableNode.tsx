import { memo, useCallback, useState, useMemo } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import NodeFrame from "../NodeFrame";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Calendar } from "@/components/shadcn/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import {
  LuPlus,
  LuTrash2,
  LuCopy,
  LuArrowUp,
  LuArrowDown,
  LuGripVertical,
  LuCalendar,
  LuType,
  LuHash,
  LuChevronUp,
  LuChevronDown,
  LuArrowUpDown,
} from "react-icons/lu";
import { BsThreeDots } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

type ColumnType = "text" | "number" | "date";

interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
}

interface TableRowData {
  id: string;
  [key: string]: any; // Les colonnes dynamiques (col1, col2, etc.)
}

interface TableData {
  columns: TableColumn[];
  rows: TableRowData[];
}

const DEFAULT_TABLE_DATA: TableData = {
  columns: [
    { id: "col1", name: "Colonne 1", type: "text" },
    { id: "col2", name: "Colonne 2", type: "number" },
  ],
  rows: [
    { id: "row1", col1: "", col2: "" },
    { id: "row2", col1: "", col2: "" },
  ],
};

function TableNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();
  const tableData: TableData = (xyNode.data?.tableData as TableData) || DEFAULT_TABLE_DATA;

  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");

  const updateTableData = useCallback(
    (newData: TableData) => {
      updateNodeData(xyNode.id, { tableData: newData });
    },
    [updateNodeData, xyNode.id]
  );

  // Validation de cellule
  const validateCell = useCallback((value: any, type: ColumnType): boolean => {
    if (!value || value === "") return true; // Empty is valid

    switch (type) {
      case "number":
        return !isNaN(Number(value));
      case "date":
        try {
          const date = typeof value === "string" ? parseISO(value) : value;
          return isValid(date);
        } catch {
          return false;
        }
      default:
        return true;
    }
  }, []);

  // Gestion de l'édition de cellule
  const startEditing = useCallback((rowId: string, colId: string, currentValue: any) => {
    setEditingCell({ rowId, colId });
    setEditValue(currentValue || "");
  }, []);

  const saveCell = useCallback(() => {
    if (!editingCell) return;

    const newRows = tableData.rows.map((row) =>
      row.id === editingCell.rowId
        ? { ...row, [editingCell.colId]: editValue }
        : row
    );

    updateTableData({ ...tableData, rows: newRows });
    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, tableData, updateTableData]);

  // Ajouter une colonne
  const addColumn = useCallback(
    (type: ColumnType) => {
      const newColId = `col${Date.now()}`;
      const newColumn: TableColumn = { id: newColId, name: `Colonne ${tableData.columns.length + 1}`, type };
      const newRows = tableData.rows.map((row) => ({
        ...row,
        [newColId]: "",
      }));

      updateTableData({
        columns: [...tableData.columns, newColumn],
        rows: newRows,
      });
    },
    [tableData, updateTableData]
  );

  // Supprimer une colonne
  const deleteColumn = useCallback(
    (colId: string) => {
      const newColumns = tableData.columns.filter((col) => col.id !== colId);
      const newRows = tableData.rows.map((row) => {
        const { [colId]: _, ...rest } = row;
        return rest;
      });

      updateTableData({ columns: newColumns, rows: newRows });
    },
    [tableData, updateTableData]
  );

  // Renommer une colonne
  const renameColumn = useCallback(
    (colId: string, newName: string) => {
      const newColumns = tableData.columns.map((col) =>
        col.id === colId ? { ...col, name: newName } : col
      );
      updateTableData({ ...tableData, columns: newColumns });
      setEditingColumnId(null);
      setEditingColumnName("");
    },
    [tableData, updateTableData]
  );

  // Changer le type d'une colonne
  const changeColumnType = useCallback(
    (colId: string, newType: ColumnType) => {
      const newColumns = tableData.columns.map((col) =>
        col.id === colId ? { ...col, type: newType } : col
      );
      updateTableData({ ...tableData, columns: newColumns });
    },
    [tableData, updateTableData]
  );

  // Déplacer une colonne
  const moveColumn = useCallback(
    (colId: string, direction: "left" | "right") => {
      const index = tableData.columns.findIndex((col) => col.id === colId);
      if (
        (direction === "left" && index === 0) ||
        (direction === "right" && index === tableData.columns.length - 1)
      )
        return;

      const newColumns = [...tableData.columns];
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];

      updateTableData({ ...tableData, columns: newColumns });
    },
    [tableData, updateTableData]
  );

  // Ajouter une ligne
  const addRow = useCallback(() => {
    const newRowId = `row${Date.now()}`;
    const newRow: TableRowData = { id: newRowId };
    tableData.columns.forEach((col) => {
      newRow[col.id] = "";
    });

    updateTableData({
      ...tableData,
      rows: [...tableData.rows, newRow],
    });
  }, [tableData, updateTableData]);

  // Supprimer une ligne
  const deleteRow = useCallback(
    (rowId: string) => {
      const newRows = tableData.rows.filter((row) => row.id !== rowId);
      updateTableData({ ...tableData, rows: newRows });
    },
    [tableData, updateTableData]
  );

  // Dupliquer une ligne
  const duplicateRow = useCallback(
    (rowId: string) => {
      const rowIndex = tableData.rows.findIndex((row) => row.id === rowId);
      if (rowIndex === -1) return;

      const rowToDuplicate = tableData.rows[rowIndex];
      const newRow: TableRowData = {
        ...rowToDuplicate,
        id: `row${Date.now()}`,
      };

      const newRows = [...tableData.rows];
      newRows.splice(rowIndex + 1, 0, newRow);

      updateTableData({ ...tableData, rows: newRows });
    },
    [tableData, updateTableData]
  );

  // Déplacer une ligne
  const moveRow = useCallback(
    (rowId: string, direction: "up" | "down") => {
      const index = tableData.rows.findIndex((row) => row.id === rowId);
      if ((direction === "up" && index === 0) || (direction === "down" && index === tableData.rows.length - 1))
        return;

      const newRows = [...tableData.rows];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];

      updateTableData({ ...tableData, rows: newRows });
    },
    [tableData, updateTableData]
  );

  // Configuration des colonnes TanStack Table
  const columns: ColumnDef<TableRowData>[] = useMemo(() => {
    const cols: ColumnDef<TableRowData>[] = tableData.columns.map((col) => ({
      id: col.id,
      accessorKey: col.id,
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <div className="flex items-center gap-1">
            {editingColumnId === col.id ? (
              <Input
                value={editingColumnName}
                onChange={(e) => setEditingColumnName(e.target.value)}
                onBlur={() => renameColumn(col.id, editingColumnName)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") renameColumn(col.id, editingColumnName);
                  if (e.key === "Escape") {
                    setEditingColumnId(null);
                    setEditingColumnName("");
                  }
                }}
                className="h-6 text-xs"
                autoFocus
              />
            ) : (
              <span
                className="cursor-pointer"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingColumnId(col.id);
                  setEditingColumnName(col.name);
                }}
              >
                {col.name}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-5 w-5"
              onClick={() => column.toggleSorting()}
            >
              {isSorted === "asc" ? (
                <LuChevronUp className="h-3 w-3" />
              ) : isSorted === "desc" ? (
                <LuChevronDown className="h-3 w-3" />
              ) : (
                <LuArrowUpDown className="h-3 w-3" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-5 w-5">
                  <BsThreeDots className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingColumnId(col.id);
                    setEditingColumnName(col.name);
                  }}
                >
                  Renommer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Type de colonne</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => changeColumnType(col.id, "text")}>
                      <LuType className="mr-2 h-4 w-4" />
                      Texte
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeColumnType(col.id, "number")}>
                      <LuHash className="mr-2 h-4 w-4" />
                      Nombre
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeColumnType(col.id, "date")}>
                      <LuCalendar className="mr-2 h-4 w-4" />
                      Date
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => moveColumn(col.id, "left")}>
                  <LuArrowUp className="mr-2 h-4 w-4 rotate-[-90deg]" />
                  Déplacer à gauche
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveColumn(col.id, "right")}>
                  <LuArrowDown className="mr-2 h-4 w-4 rotate-[-90deg]" />
                  Déplacer à droite
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteColumn(col.id)} className="text-destructive">
                  <LuTrash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      cell: ({ row, column }) => {
        const value = row.original[col.id];
        const isEditing = editingCell?.rowId === row.original.id && editingCell?.colId === col.id;
        const isValid = validateCell(value, col.type);

        if (isEditing) {
          if (col.type === "date") {
            return (
              <Popover open={isEditing} onOpenChange={(open) => !open && saveCell()}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 w-full justify-start text-left font-normal">
                    <LuCalendar className="mr-2 h-4 w-4" />
                    {value ? format(parseISO(value), "PPP", { locale: fr }) : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value ? parseISO(value) : undefined}
                    onSelect={(date) => {
                      setEditValue(date ? date.toISOString() : "");
                      setTimeout(() => saveCell(), 100);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            );
          }

          return (
            <Input
              type={col.type === "number" ? "number" : "text"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveCell}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveCell();
                if (e.key === "Escape") {
                  setEditingCell(null);
                  setEditValue("");
                }
              }}
              className="h-8"
              autoFocus
            />
          );
        }

        let displayValue = value;
        if (col.type === "date" && value) {
          try {
            displayValue = format(parseISO(value), "PPP", { locale: fr });
          } catch {
            displayValue = value;
          }
        }

        return (
          <div
            className={cn(
              "min-h-8 px-2 py-1 cursor-pointer rounded",
              !isValid && "bg-red-100 dark:bg-red-900/20"
            )}
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEditing(row.original.id, col.id, value);
            }}
          >
            {displayValue || ""}
          </div>
        );
      },
    }));

    // Ajouter une colonne pour les actions de ligne
    cols.push({
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-6 w-6">
              <LuGripVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => moveRow(row.original.id, "up")}>
              <LuArrowUp className="mr-2 h-4 w-4" />
              Déplacer vers le haut
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => moveRow(row.original.id, "down")}>
              <LuArrowDown className="mr-2 h-4 w-4" />
              Déplacer vers le bas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => duplicateRow(row.original.id)}>
              <LuCopy className="mr-2 h-4 w-4" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => deleteRow(row.original.id)} className="text-destructive">
              <LuTrash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });

    return cols;
  }, [
    tableData.columns,
    editingCell,
    editValue,
    editingColumnId,
    editingColumnName,
    startEditing,
    saveCell,
    deleteColumn,
    changeColumnType,
    moveColumn,
    renameColumn,
    deleteRow,
    duplicateRow,
    moveRow,
    validateCell,
  ]);

  const table = useReactTable({
    data: tableData.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  if (!xyNode) return null;

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <LuPlus className="mr-2 h-4 w-4" />
              Ajouter colonne
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => addColumn("text")}>
              <LuType className="mr-2 h-4 w-4" />
              Texte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addColumn("number")}>
              <LuHash className="mr-2 h-4 w-4" />
              Nombre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addColumn("date")}>
              <LuCalendar className="mr-2 h-4 w-4" />
              Date
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={addRow}>
          <LuPlus className="mr-2 h-4 w-4" />
          Ajouter ligne
        </Button>
      </CanvasNodeToolbar>

      <NodeFrame xyNode={xyNode}>
        <div className="overflow-auto max-h-full w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                    Aucune donnée
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </NodeFrame>
    </>
  );
}

export default memo(TableNode);
