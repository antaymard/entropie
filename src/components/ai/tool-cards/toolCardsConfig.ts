import type { ToolCardProps } from "@/types/message.types";
import WebsearchToolCard from "./WebsearchToolCard";
import OpenWebpageToolCard from "./OpenWebpageToolCard";
import ReadCanvasToolCard from "./ReadCanvasToolCard";
import ViewImageToolCard from "./ViewImageToolCard";
import ReadPdfToolCard from "./ReadPdfToolCard";

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
  {
    name: "tool-read_canvas",
    component: ReadCanvasToolCard as React.ComponentType<
      ToolCardProps<unknown, unknown>
    >,
  },
  {
    name: "tool-view_image",
    component: ViewImageToolCard as React.ComponentType<
      ToolCardProps<unknown, unknown>
    >,
  },
  {
    name: "tool-read_pdf",
    component: ReadPdfToolCard as React.ComponentType<
      ToolCardProps<unknown, unknown>
    >,
  },
];
export default tools;
