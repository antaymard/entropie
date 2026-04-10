import type { ToolCardProps } from "@/types/message.types";
import { TbBrowser } from "react-icons/tb";
import ToolCardFrame from "./ToolCardFrame";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <ToolCardFrame icon={TbBrowser} name={t("toolCards.readingCanvas")} state={state} />
  );
}
