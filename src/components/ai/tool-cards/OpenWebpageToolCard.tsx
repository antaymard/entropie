import type { ToolCardProps } from "@/types/message.types";
import { TbPointer } from "react-icons/tb";
import ToolCardFrame from "./ToolCardFrame";

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
  return (
    <ToolCardFrame
      icon={TbPointer}
      name="Web page navigation"
      state={state}
      canBeExpanded={true}
    >
      <div className="flex flex-col divide-y divide-white/20 -mx-2 text-white">
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
    </ToolCardFrame>
  );
}
