import type { ToolCardProps } from "@/types/message.types";
import { TbPhotoSearch } from "react-icons/tb";
import { RiLoaderLine } from "react-icons/ri";
import { useState } from "react";

interface ViewImageInput {
  url: string;
}

type ViewImageToolProps = ToolCardProps<ViewImageInput, unknown>;

export default function ViewImageToolCard({
  state,
  input,
  output,
}: ViewImageToolProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full bg-white/10 border border-white/20 rounded-sm text-primary p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white text-sm font-semibold">
          <TbPhotoSearch size={15} />
          Lecture de l'image
        </div>
        {state === "input-streaming" ? (
          <RiLoaderLine size={15} className="animate-spin text-white" />
        ) : null}
        {state === "output-available" ? (
          <a
            className="text-xs text-white hover:underline"
            target="_blank"
            href={input?.url}
          >
            Voir l'image
          </a>
        ) : null}
      </div>
    </div>
  );
}
