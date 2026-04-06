import { TbCalendar, TbLink } from "react-icons/tb";
import { Checkbox } from "@/components/shadcn/checkbox";
import type { ColumnType, CellValue, LinkCellValue } from "./types";

export interface CellDisplayProps {
  type: ColumnType;
  value: CellValue | undefined;
}

export function CellDisplay({ type, value }: CellDisplayProps) {
  if (type === "checkbox") {
    return <Checkbox checked={!!value} disabled className="block" />;
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
    return (
      <span className="flex items-center gap-1 w-full min-h-[1.4em] rounded px-1">
        {displayValue && (
          <TbCalendar size={13} className="shrink-0 text-muted-foreground" />
        )}
        {displayValue}
      </span>
    );
  }

  if (type === "link") {
    const linkVal = value as LinkCellValue | null | undefined;
    let displayLabel = linkVal?.pageTitle ?? "";
    if (!displayLabel && linkVal?.href) {
      try {
        displayLabel = new URL(linkVal.href).hostname.replace(/^www\./, "");
      } catch {
        displayLabel = linkVal.href;
      }
    }
    return (
      <span className="flex items-center gap-1 w-full min-h-[1.4em] rounded px-1">
        {displayLabel && linkVal?.href ? (
          <>
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
          </>
        ) : null}
      </span>
    );
  }

  return (
    <span className="block w-full min-h-[1.4em] rounded px-1">
      {value != null ? String(value) : ""}
    </span>
  );
}
