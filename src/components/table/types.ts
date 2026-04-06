export type ColumnType = "text" | "number" | "checkbox" | "date" | "link";

export interface LinkCellValue {
  href: string;
  pageTitle: string;
  pageImage?: string;
  pageDescription?: string;
}

export type CellValue = string | number | boolean | LinkCellValue | null;

export interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
}

export interface TableRowData {
  id: string;
  cells: Record<string, CellValue>;
}

export interface TableData {
  columns: TableColumn[];
  rows: TableRowData[];
}

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: "Text",
  number: "Number",
  checkbox: "Checkbox",
  date: "Date",
  link: "Link",
};
