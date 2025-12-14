import type { ToolCardProps } from "@/types/message.types";
import { TbPointer } from "react-icons/tb";
import { RiLoaderLine } from "react-icons/ri";
import { HiMiniChevronDown } from "react-icons/hi2";
import { useState } from "react";

interface OpenWebpageInput {
  urls: string[];
  objective: string;
  search_queries?: string[];
}
interface OpenWebpageResult {
  url: string;
  title: string;
  full_content: string;
  excerpts: string[];
  publish_date?: string;
}
type OpenWebpageToolCardProps = ToolCardProps<
  OpenWebpageInput,
  OpenWebpageResult[]
>;

export default function OpenWebpageToolCard({
  state,
  input,
  output,
}: OpenWebpageToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full bg-white/10 border border-white/20 rounded-sm text-primary p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white text-sm font-semibold">
          <TbPointer size={15} />
          Navigation sur la page
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
          {output?.map((result, index) => (
            <div key={index} className="p-2">
              <a
                href={result.url}
                target="_blank"
                className="hover:underline underline-offset-2"
              >
                <p>{result.title}</p>
              </a>
              <div className="text-sm leading-tight text-white/60 flex items-center justify-between">
                <p>{new URL(result.url).hostname}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
