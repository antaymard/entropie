import type { NodeField } from "../../types";

export default function ImageUrlField({
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
  return <img src={value || "https://placehold.co/600x400"} alt={field.name} />;
}
