export type ColumnType = "text" | "number" | "checkbox" | "date" | "link" | "node";

export interface LinkCellValue {
  href: string;
  pageTitle: string;
  pageImage?: string;
  pageDescription?: string;
}

export interface NodeCellValue {
  nodeId: string;
}

export type CellValue = string | number | boolean | LinkCellValue | NodeCellValue | null;

export interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
  width?: number;
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
  node: "Node",
};
