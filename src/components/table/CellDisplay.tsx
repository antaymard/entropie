import { TbCalendar, TbLink, TbNetwork } from "react-icons/tb";
import { useStore } from "@xyflow/react";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  getNodeDataTitle,
  getNodeIcon,
} from "@/components/utils/nodeDataDisplayUtils";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import type { Id } from "@/../convex/_generated/dataModel";
import type { ColumnType, CellValue, LinkCellValue, NodeCellValue } from "./types";

export interface CellDisplayProps {
  type: ColumnType;
  value: CellValue | undefined;
}

export function CellDisplay({ type, value }: CellDisplayProps) {
  const nodes = useStore((state) => state.nodes);
  const nodeDatas = useNodeDataStore((state) => state.nodeDatas);

  if (type === "node") {
    const nodeVal = value as NodeCellValue | null | undefined;
    const node = nodeVal?.nodeId
      ? nodes.find((n) => n.id === nodeVal.nodeId)
      : undefined;
    const nodeDataId = node?.data?.nodeDataId as Id<"nodeDatas"> | undefined;
    const nodeData = nodeDataId ? nodeDatas.get(nodeDataId) : undefined;
    const title = nodeData
      ? getNodeDataTitle(nodeData)
      : nodeVal?.nodeId
        ? "Node supprimé"
        : null;
    const Icon = nodeData ? getNodeIcon(nodeData.type) : null;

    if (!title) {
      return <span className="block w-full min-h-[1.4em] px-1" />;
    }
    return (
      <span className="flex items-center gap-1 w-full min-h-[1.4em] px-1">
        <span
          className={`inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-sm font-medium max-w-full${!nodeData ? " opacity-50" : ""}`}
        >
          {Icon ? (
            <Icon size={13} className="shrink-0 text-muted-foreground" />
          ) : (
            <TbNetwork size={13} className="shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{title}</span>
        </span>
      </span>
    );
  }

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
    <span className="block w-full min-h-[1.4em] rounded px-1 truncate">
      {value != null ? String(value) : ""}
    </span>
  );
}
