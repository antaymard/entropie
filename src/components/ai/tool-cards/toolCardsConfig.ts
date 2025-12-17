import type { ToolCardProps } from "@/types/message.types";
import WebsearchToolCard from "./WebsearchToolCard";
import OpenWebpageToolCard from "./OpenWebpageToolCard";
import ReadCanvasToolCard from "./ReadCanvasToolCard";
import ViewImageToolCard from "./ViewImageToolCard";
import ReadPdfToolCard from "./ReadPdfToolCard";
import ReadNodeConfigsToolCard from "./ReadNodeConfigsToolCard";
import EditCanvasNodesAndEdgesToolCard from "./EditCanvasNodesAndEdgesToolCard";

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
  {
    name: "tool-read_node_configs",
    component: ReadNodeConfigsToolCard as React.ComponentType<
      ToolCardProps<unknown, unknown>
    >,
  },
  {
    name: "tool-edit_canvas_nodes_and_edges",
    component: EditCanvasNodesAndEdgesToolCard as React.ComponentType<
      ToolCardProps<unknown, unknown>
    >,
  },
];
export default tools;
