import type { BaseFieldProps } from "@/types/ui";
import type { Value } from "platejs";
import { RiFileList3Line } from "react-icons/ri";
import { useTranslation } from "react-i18next";

interface DocumentNameFieldProps extends BaseFieldProps<{ doc: Value }> {
  documentTitle?: string;
}

export default function DocumentNameField({ field }: DocumentNameFieldProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-8 gap-2 items-center p-2 rounded-md bg-slate-100 hover:bg-slate-200">
      <RiFileList3Line size={16} />
      {field?.name || t("nodes.document")}
    </div>
  );
}
