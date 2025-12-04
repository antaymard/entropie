import type { BaseFieldProps } from "@/types/field.types";
import type { Value } from "platejs";
import { HiOutlineDocumentText } from "react-icons/hi2";

interface DocumentNameFieldProps extends BaseFieldProps<{ doc: Value }> {
  documentTitle?: string;
}

export default function DocumentNameField({
  field,
  value,
  onChange,
  visualSettings,
  documentTitle = "Document",
}: DocumentNameFieldProps) {
  return (
    <div className="flex gap-2 items-center p-2 rounded-md bg-gray-100 hover:bg-gray-200">
      <HiOutlineDocumentText />
      {documentTitle}
    </div>
  );
}
