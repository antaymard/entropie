import type { NodeField } from "../../types";

export default function ShortTextField({
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
  return <h3 className="">{field.name}</h3>;
}
