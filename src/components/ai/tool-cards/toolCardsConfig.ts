import type { ToolCardProps } from "@/types/message.types";
import WebsearchToolCard from "./WebsearchToolCard";
import OpenWebpageToolCard from "./OpenWebpageToolCard";

interface ToolCardConfig {
  name: string;
  component: React.ComponentType<ToolCardProps<unknown, unknown>>;
}

const tools: ToolCardConfig[] = [
  {
    name: "tool-web_search",
    component: WebsearchToolCard as React.ComponentType<
      ToolCardProps<unknown, unknown>
    >,
  },
  {
    name: "tool-open_web_page",
    component: OpenWebpageToolCard as React.ComponentType<
      ToolCardProps<unknown, unknown>
    >,
  },
];

export default tools;
