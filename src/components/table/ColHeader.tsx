import type { Column } from "@tanstack/react-table";
import type { IconType } from "react-icons";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  TbChevronDown,
  TbArrowUp,
  TbArrowDown,
  TbArrowsSort,
  TbTrash,
  TbList,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import type { TableColumn, TableRowData, ColumnType } from "./types";
import { COLUMN_TYPE_CONFIG } from "./types";

export interface ColHeaderProps {
  col: TableColumn;
  tanstackCol: Column<TableRowData, unknown>;
  isEditing: boolean;
  readOnly?: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onNameChange: (name: string) => void;
  onTypeChange: (type: ColumnType) => void;
  onDelete: () => void;
  onEditOptions?: () => void;
}

export function ColHeader({
  col,
  tanstackCol,
  isEditing,
  readOnly,
  onEditStart,
  onEditEnd,
  onNameChange,
  onTypeChange,
  onDelete,
  onEditOptions,
}: ColHeaderProps) {
  const sorted = tanstackCol.getIsSorted();
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
            "truncate font-medium flex items-center gap-1",
            !readOnly && "cursor-pointer hover:underline",
          )}
          onClick={readOnly ? undefined : onEditStart}
        >
          {col.name}
          {sorted === "asc" && <TbArrowUp size={12} className="shrink-0" />}
          {sorted === "desc" && <TbArrowDown size={12} className="shrink-0" />}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 shrink-0 opacity-50 hover:opacity-100"
          >
            <TbChevronDown size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => tanstackCol.toggleSorting(false)}>
            <TbArrowUp size={14} className="mr-2" />
            Sort ascending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => tanstackCol.toggleSorting(true)}>
            <TbArrowDown size={14} className="mr-2" />
            Sort descending
          </DropdownMenuItem>
          {sorted && (
            <DropdownMenuItem onClick={() => tanstackCol.clearSorting()}>
              <TbArrowsSort size={14} className="mr-2" />
              Clear sort
            </DropdownMenuItem>
          )}
          {!readOnly && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Change column type
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(
                    Object.entries(COLUMN_TYPE_CONFIG) as [
                      ColumnType,
                      { label: string; icon: IconType },
                    ][]
                  ).map(([value, config]) => {
                    const Icon = config.icon;
                    return (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => onTypeChange(value)}
                        className={cn(col.type === value && "font-semibold")}
                      >
                        <Icon size={12} className="mr-2 opacity-70" />
                        {config.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {col.type === "select" && onEditOptions && (
                <DropdownMenuItem onClick={onEditOptions}>
                  <TbList size={14} className="mr-2" />
                  Edit options…
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <TbTrash size={14} className="mr-2" />
                Delete column
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
