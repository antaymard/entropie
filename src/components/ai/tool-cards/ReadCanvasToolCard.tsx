import type { ToolCardProps } from "@/types/message.types";
import { TbBrowser } from "react-icons/tb";
import ToolCardFrame from "./ToolCardFrame";

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
  return (
    <ToolCardFrame icon={TbBrowser} name="Lecture du canvas" state={state} />
  );
}
