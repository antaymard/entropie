import type { NodeField } from "../../types";

export default function UrlField({
  field,
  isTemplatePreview = false,
  value,
  visual,
}: {
  field: NodeField;
  isTemplatePreview?: boolean;
  value?: string;
  visual?: string;
}) {
  return (
    <a href="#" className="text-blue-500 hover:underline">
      Lien
    </a>
  );
}
