import type { ToolCardProps } from "@/types/message.types";
import { TbBrowser } from "react-icons/tb";
import { RiLoaderLine } from "react-icons/ri";
import { useState } from "react";

interface ReadCanvasInput {
  canvasId: string;
  scope: string[];
}

type ReadCanvasToolCardProps = ToolCardProps<ReadCanvasInput, unknown>;

export default function OpenWebpageToolCard({
  state,
  input,
  output,
}: ReadCanvasToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full bg-white/10 border border-white/20 rounded-sm text-primary p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white text-sm font-semibold">
          <TbBrowser size={15} />
          Lecture du canvas
        </div>
        {state === "input-streaming" ? (
          <RiLoaderLine size={15} className="animate-spin text-white" />
        ) : null}
      </div>
    </div>
  );
}
