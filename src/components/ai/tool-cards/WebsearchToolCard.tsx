import type { ToolCardProps } from "@/types/message.types";
import { TbWorldSearch } from "react-icons/tb";
import ToolCardFrame from "./ToolCardFrame";

interface WebSearchInput {
  objective: string;
  search_queries?: string[];
  search_effort?: "low" | "medium" | "high";
}
interface WebSearchResult {
  excerpts: string[];
  publish_date?: string;
  title: string;
  url: string;
}
type WebsearchToolCardProps = ToolCardProps<WebSearchInput, WebSearchResult[]>;

function getRelativeTime(dateString: string | undefined): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}mo ago`;
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years}y ago`;
}

export default function WebsearchToolCard({
  state,
  input,
  output,
}: WebsearchToolCardProps) {
  return (
    <ToolCardFrame
      icon={TbWorldSearch}
      name="Web search"
      state={state}
      canBeExpanded={true}
      detailLabel={`${output?.length ?? 0} results`}
    >
      <div className="flex flex-col divide-y divide-white/20 -mx-2 text-white">
        {input?.search_queries && (
          <div className="p-2 pb-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p>Search objective </p>
              <p className="text-xs! px-1.5 py-0.5 rounded-sm bg-white/50 text-primary">
                {input?.search_effort} effort
              </p>
            </div>
            <p className="text-sm! text-white/70 -mt-2">{input?.objective}</p>
            <p className="text-sm mb-2">Search keywords:</p>
            <ul className="list-disc list-inside text-sm text-white/70 flex flex-col gap-3 pt-1">
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
    </ToolCardFrame>
  );
}
