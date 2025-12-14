import type { ToolCardProps } from "@/types/message.types";
import { TbPhotoSearch } from "react-icons/tb";
import { RiLoaderLine } from "react-icons/ri";
import { useState } from "react";
import { HiMiniChevronDown } from "react-icons/hi2";

interface ViewImageInput {
  url: string;
  objective: string;
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
          <button
            className="text-white flex items-center gap-1"
            type="button"
            onClick={() => setExpanded(!expanded)}
          >
            <HiMiniChevronDown size={15} className="text-white" />
          </button>
        ) : null}
      </div>

      {state === "output-available" && expanded ? (
        <div className="flex flex-col divide-y divide-white/20 -mx-2 text-white mt-3 -mb-2">
          <div className="p-2">
            <p>Objectif</p>
            <p>{input?.objective}</p>
          </div>
          <div className="p-2">
            <img
              src={input?.url}
              alt="Analyzed Image"
              className="w-full rounded-md object-cover"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
