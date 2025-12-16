import { useState, type ReactNode } from "react";
import { RiLoaderLine } from "react-icons/ri";
import { HiMiniChevronDown } from "react-icons/hi2";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

interface ToolCardFrameProps {
  icon: IconType;
  name: string;
  state: "input-streaming" | "output-available";
  canBeExpanded?: boolean;
  detailLabel?: string;
  children?: ReactNode;
}

export default function ToolCardFrame({
  icon: Icon,
  name,
  state,
  canBeExpanded = true,
  detailLabel,
  children,
}: ToolCardFrameProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full bg-white/10 border border-white/20 rounded-sm text-primary p-2">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center gap-2 text-white text-sm font-semibold",
            {
              "animate-pulse": state === "input-streaming",
            }
          )}
        >
          <Icon size={15} />
          {name}
        </div>
        {state === "input-streaming" ? (
          <RiLoaderLine size={15} className="animate-spin text-white" />
        ) : null}
        {state === "output-available" && canBeExpanded ? (
          <button
            className="text-white flex items-center gap-1"
            type="button"
            onClick={() => setExpanded(!expanded)}
          >
            {detailLabel && <span className="text-xs">{detailLabel}</span>}
            <HiMiniChevronDown
              size={15}
              className={`text-white transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        ) : null}
      </div>

      {state === "output-available" && expanded && children ? (
        <div className="mt-3 -mb-2">{children}</div>
      ) : null}
    </div>
  );
}
