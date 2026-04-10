import type { ToolCardProps } from "@/types/message.types";
import { TbPhotoSearch } from "react-icons/tb";
import ToolCardFrame from "./ToolCardFrame";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <ToolCardFrame
      icon={TbPhotoSearch}
      name={t("toolCards.readingImage")}
      state={state}
      canBeExpanded={true}
    >
      <div className="flex flex-col divide-y divide-white/20 -mx-2 text-white">
        <div className="p-2">
          <p>Objective</p>
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
    </ToolCardFrame>
  );
}
