import { memo, useCallback, useState, useMemo } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import { areNodePropsEqual } from "../areNodePropsEqual";
import { TbArrowsSort, TbChevronDown, TbChevronUp } from "react-icons/tb";
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
  [key: string]: string | number; // Les colonnes dynamiques (col1, col2, etc.)
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

// Fonctions utilitaires
const generateId = (prefix: string) => `${prefix}${Date.now()}`;

const createEmptyRow = (columns: TableColumn[]): TableRowData => {
  const row: TableRowData = { id: generateId("row") };
  columns.forEach((col) => {
    row[col.id] = "";
  });
  return row;
};

const formatDateValue = (value: string | undefined): string => {
  if (!value) return "Choisir une date";
  try {
    const tempDate = parseISO(value);
    return isValid(tempDate) ? format(tempDate, "PPP", { locale: fr }) : "Date invalide";
  } catch {
    return "Date invalide";
  }
};

const parseDateValue = (value: string | undefined): Date | undefined => {
  if (!value) return undefined;
  try {
    const tempDate = parseISO(value);
    return isValid(tempDate) ? tempDate : undefined;
  } catch {
    return undefined;
  }
};

// Hook personnalisé pour les opérations de table
const useTableOperations = (tableData: TableData, updateTableData: (data: TableData) => void) => {
  // Ajouter une colonne
  const addColumn = useCallback(
    (type: ColumnType) => {
      const newColId = generateId("col");
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [colId]: _, ...rest } = row;
        return rest as TableRowData;
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
    const newRow = createEmptyRow(tableData.columns);
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
        id: generateId("row"),
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

  return {
    addColumn,
    deleteColumn,
    renameColumn,
    changeColumnType,
    moveColumn,
    addRow,
    deleteRow,
    duplicateRow,
    moveRow,
  };
};

// Composant pour l'édition de cellule
interface CellEditorProps {
  columnType: ColumnType;
  cellEdit: { rowId: string; colId: string; value: string | number };
  setCellEdit: (edit: { rowId: string; colId: string; value: string | number } | null) => void;
  saveCell: () => void;
  tableData: TableData;
  updateTableData: (data: TableData) => void;
}

const CellEditor = memo(({ columnType, cellEdit, setCellEdit, saveCell, tableData, updateTableData }: CellEditorProps) => {
  if (columnType === "date") {
    const valueStr = typeof cellEdit.value === "string" ? cellEdit.value : String(cellEdit.value);
    const parsedDate = parseDateValue(valueStr);
    const displayText = formatDateValue(valueStr);
    
    return (
      <Popover open={true}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 w-full justify-start text-left font-normal">
            <LuCalendar className="mr-2 h-4 w-4" />
            {displayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="start" 
          onEscapeKeyDown={() => setCellEdit(null)}
        >
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={(date) => {
              const newValue = date ? date.toISOString() : "";
              const newRows = tableData.rows.map((r) =>
                r.id === cellEdit.rowId
                  ? { ...r, [cellEdit.colId]: newValue }
                  : r
              );
              updateTableData({ ...tableData, rows: newRows });
              setCellEdit(null);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Input
      type={columnType === "number" ? "number" : "text"}
      value={cellEdit.value || ""}
      onChange={(e) => setCellEdit({ ...cellEdit, value: e.target.value })}
      onBlur={saveCell}
      onKeyDown={(e) => {
        if (e.key === "Enter") saveCell();
        if (e.key === "Escape") setCellEdit(null);
      }}
      className="h-8"
      autoFocus
    />
  );
});

CellEditor.displayName = "CellEditor";

// Composant pour l'affichage de cellule
interface CellDisplayProps {
  value: string | number | undefined;
  columnType: ColumnType;
  isValid: boolean;
  onDoubleClick: () => void;
}

const CellDisplay = memo(({ value, columnType, isValid, onDoubleClick }: CellDisplayProps) => {
  let displayValue: string | number | undefined = value;
  if (columnType === "date" && value) {
    displayValue = formatDateValue(typeof value === "string" ? value : String(value));
  }

  return (
    <div
      className={cn(
        "min-h-8 px-2 py-1 cursor-pointer rounded",
        !isValid && "bg-red-100 dark:bg-red-900/20"
      )}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      {displayValue || ""}
    </div>
  );
});

CellDisplay.displayName = "CellDisplay";

// Composant pour le menu d'actions des colonnes
interface ColumnActionsMenuProps {
  column: TableColumn;
  setColumnEdit: (edit: { id: string; name: string }) => void;
  operations: ReturnType<typeof useTableOperations>;
}

const ColumnActionsMenu = memo(({ column, setColumnEdit, operations }: ColumnActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="h-5 w-5">
          <BsThreeDots className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setColumnEdit({ id: column.id, name: column.name })}>
          Renommer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Type de colonne</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => operations.changeColumnType(column.id, "text")}>
              <LuType className="mr-2 h-4 w-4" />
              Texte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => operations.changeColumnType(column.id, "number")}>
              <LuHash className="mr-2 h-4 w-4" />
              Nombre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => operations.changeColumnType(column.id, "date")}>
              <LuCalendar className="mr-2 h-4 w-4" />
              Date
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => operations.moveColumn(column.id, "left")}>
          <LuArrowUp className="mr-2 h-4 w-4 -rotate-90" />
          Déplacer à gauche
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => operations.moveColumn(column.id, "right")}>
          <LuArrowDown className="mr-2 h-4 w-4 -rotate-90" />
          Déplacer à droite
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => operations.deleteColumn(column.id)} className="text-destructive">
          <LuTrash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ColumnActionsMenu.displayName = "ColumnActionsMenu";

// Composant pour le menu d'actions des lignes
interface RowActionsMenuProps {
  rowId: string;
  operations: ReturnType<typeof useTableOperations>;
}

const RowActionsMenu = memo(({ rowId, operations }: RowActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="h-6 w-6">
          <LuGripVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => operations.moveRow(rowId, "up")}>
          <LuArrowUp className="mr-2 h-4 w-4" />
          Déplacer vers le haut
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => operations.moveRow(rowId, "down")}>
          <LuArrowDown className="mr-2 h-4 w-4" />
          Déplacer vers le bas
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => operations.duplicateRow(rowId)}>
          <LuCopy className="mr-2 h-4 w-4" />
          Dupliquer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => operations.deleteRow(rowId)} className="text-destructive">
          <LuTrash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

RowActionsMenu.displayName = "RowActionsMenu";

// Composant pour l'en-tête de colonne
interface ColumnHeaderProps {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: () => void;
  };
  tableColumn: TableColumn;
  columnEdit: { id: string; name: string } | null;
  setColumnEdit: (edit: { id: string; name: string } | null) => void;
  operations: ReturnType<typeof useTableOperations>;
}

const ColumnHeader = memo(({ column, tableColumn, columnEdit, setColumnEdit, operations }: ColumnHeaderProps) => {
  const isSorted = column.getIsSorted();
  
  return (
    <div className="flex items-center gap-1">
      {columnEdit?.id === tableColumn.id ? (
        <Input
          value={columnEdit.name}
          onChange={(e) => setColumnEdit({ id: tableColumn.id, name: e.target.value })}
          onBlur={() => {
            operations.renameColumn(tableColumn.id, columnEdit.name);
            setColumnEdit(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              operations.renameColumn(tableColumn.id, columnEdit.name);
              setColumnEdit(null);
            }
            if (e.key === "Escape") setColumnEdit(null);
          }}
          className="h-6 text-xs"
          autoFocus
        />
      ) : (
        <span
          className="cursor-pointer"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setColumnEdit({ id: tableColumn.id, name: tableColumn.name });
          }}
        >
          {tableColumn.name}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-5 w-5"
        onClick={() => column.toggleSorting()}
      >
        {isSorted === "asc" ? (
          <TbChevronUp className="h-3 w-3" />
        ) : isSorted === "desc" ? (
          <TbChevronDown className="h-3 w-3" />
        ) : (
          <TbArrowsSort size={10} />
        )}
      </Button>
      <ColumnActionsMenu
        column={tableColumn}
        setColumnEdit={setColumnEdit}
        operations={operations}
      />
    </div>
  );
});

ColumnHeader.displayName = "ColumnHeader";

function TableNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();
  const tableData: TableData = (xyNode.data?.tableData as TableData) || DEFAULT_TABLE_DATA;

  const [cellEdit, setCellEdit] = useState<{ rowId: string; colId: string; value: string | number } | null>(null);
  const [columnEdit, setColumnEdit] = useState<{ id: string; name: string } | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const updateTableData = useCallback(
    (newData: TableData) => {
      updateNodeData(xyNode.id, { tableData: newData });
    },
    [updateNodeData, xyNode.id]
  );

  const operations = useTableOperations(tableData, updateTableData);

  // Validation de cellule
  const validateCell = useCallback((value: string | number | undefined, type: ColumnType): boolean => {
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
  const startEditing = useCallback((rowId: string, colId: string, currentValue: string | number | undefined) => {
    setCellEdit({ rowId, colId, value: currentValue || "" });
  }, []);

  const saveCell = useCallback(() => {
    if (!cellEdit) return;

    const newRows = tableData.rows.map((row) =>
      row.id === cellEdit.rowId
        ? { ...row, [cellEdit.colId]: cellEdit.value }
        : row
    );

    console.log(newRows);

    updateTableData({ ...tableData, rows: newRows });
    setCellEdit(null);
  }, [cellEdit, tableData, updateTableData]);

  // Configuration des colonnes TanStack Table
  const columns: ColumnDef<TableRowData>[] = useMemo(() => {
    const cols: ColumnDef<TableRowData>[] = tableData.columns.map((col) => ({
      id: col.id,
      accessorKey: col.id,
      header: ({ column }: { column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: () => void } }) => (
        <ColumnHeader
          column={column}
          tableColumn={col}
          columnEdit={columnEdit}
          setColumnEdit={setColumnEdit}
          operations={operations}
        />
      ),
      cell: ({ row }: { row: { original: TableRowData } }) => {
        const value = row.original[col.id];
        const isEditing = cellEdit?.rowId === row.original.id && cellEdit?.colId === col.id;
        const isValid = validateCell(value, col.type);

        if (isEditing) {
          return (
            <CellEditor
              columnType={col.type}
              cellEdit={cellEdit}
              setCellEdit={setCellEdit}
              saveCell={saveCell}
              tableData={tableData}
              updateTableData={updateTableData}
            />
          );
        }

        return (
          <CellDisplay
            value={value}
            columnType={col.type}
            isValid={isValid}
            onDoubleClick={() => startEditing(row.original.id, col.id, value)}
          />
        );
      },
    }));

    // Ajouter une colonne pour les actions de ligne
    cols.push({
      id: "actions",
      header: () => null,
      cell: ({ row }: { row: { original: TableRowData } }) => (
        <RowActionsMenu rowId={row.original.id} operations={operations} />
      ),
    });

    return cols;
  }, [
    tableData,
    cellEdit,
    columnEdit,
    operations,
    startEditing,
    saveCell,
    validateCell,
    updateTableData,
    setCellEdit,
    setColumnEdit,
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
            <DropdownMenuItem onClick={() => operations.addColumn("text")}>
              <LuType className="mr-2 h-4 w-4" />
              Texte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => operations.addColumn("number")}>
              <LuHash className="mr-2 h-4 w-4" />
              Nombre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => operations.addColumn("date")}>
              <LuCalendar className="mr-2 h-4 w-4" />
              Date
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={operations.addRow}>
          <LuPlus className="mr-2 h-4 w-4" />
          Ajouter ligne
        </Button>
      </CanvasNodeToolbar>

      <NodeFrame xyNode={xyNode}>
        <div className="overflow-auto max-h-full w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup: { id: string; headers: { id: string; column: { columnDef: ColumnDef<TableRowData> }; getContext: () => unknown }[] }) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header: { id: string; column: { columnDef: ColumnDef<TableRowData> }; getContext: () => unknown }) => (
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
                table.getRowModel().rows.map((row: { id: string; getVisibleCells: () => { id: string; column: { columnDef: ColumnDef<TableRowData> }; getContext: () => unknown }[] }) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell: { id: string; column: { columnDef: ColumnDef<TableRowData> }; getContext: () => unknown }) => (
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

export default memo(TableNode, areNodePropsEqual);
