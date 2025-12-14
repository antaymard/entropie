import type {
  WebSearchInput,
  WebSearchResult,
  ToolCardProps,
} from "@/types/message.types";
import { TbWorldSearch } from "react-icons/tb";
import { RiLoaderLine } from "react-icons/ri";
import { HiMiniChevronDown } from "react-icons/hi2";
import { useState } from "react";

type WebsearchToolCardProps = ToolCardProps<WebSearchInput, WebSearchResult[]>;

function getRelativeTime(dateString: string | undefined): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "à l'instant";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `il y a ${minutes} min`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `il y a ${hours}h`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `il y a ${days}j`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `il y a ${months} mois`;
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

export default function WebsearchToolCard({
  state,
  input,
  output,
}: WebsearchToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full bg-white/10 border border-white/20 rounded-sm text-primary p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white text-sm font-semibold">
          <TbWorldSearch size={15} />
          Recherche web
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
            <span className="text-xs">{output?.length} résultats</span>
            <HiMiniChevronDown size={15} className="text-white" />
          </button>
        ) : null}
      </div>

      {state === "output-available" && expanded ? (
        <div className="flex flex-col divide-y divide-white/20 -mx-2 text-white mt-3 -mb-2">
          {input?.search_queries && (
            <div className="p-2 pb-5 flex flex-col gap-3">
              <p>Objectif de recherche</p>
              <p className="text-sm! text-white/70 -mt-2">{input?.objective}</p>
              <p className="text-sm mb-2">Mots-clés recherchés :</p>
              <ul className="list-disc list-inside text-sm text-white/70 flex flex-col gap-1.5">
                {input.search_queries.map((query, index) => (
                  <li key={index}>{query}</li>
                ))}
              </ul>
            </div>
          )}
          {output?.map((result, index) => (
            <div key={index} className="p-2 pt-2.5">
              <a
                href={result.url}
                target="_blank"
                className="hover:underline underline-offset-2"
              >
                <p>{result.title}</p>
              </a>
              <div className="text-sm leading-tight text-white/60 flex items-center justify-between">
                <p>{new URL(result.url).hostname}</p>
                <p>{getRelativeTime(result.publish_date)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
