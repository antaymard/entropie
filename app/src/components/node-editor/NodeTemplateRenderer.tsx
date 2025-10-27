import { useFormikContext } from "formik";
import type { LayoutElement, NodeTemplate } from "../../types/node.types";
import { useNodeEditorContext } from "../../hooks/useNodeEditorContext";
import { get } from "lodash";

export default function NodeTemplateRenderer() {
  const { values } = useFormikContext<NodeTemplate>();
  const { currentVisualLayoutPath } = useNodeEditorContext();
  const fields = values.fields;
  const layout = get(values, currentVisualLayoutPath) as LayoutElement;

  return <div></div>;
}
