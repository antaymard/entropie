import { useFormikContext } from "formik";
import type {
  LayoutElement,
  NodeTemplate,
  NodeField,
} from "../../types/node.types";
import { useNodeEditorContext } from "../../hooks/useNodeEditorContext";
import { get } from "lodash";
import { useContext, type CSSProperties } from "react";
import ShortTextField from "../_fields/ShortTextField";
import UrlField from "../_fields/UrlField";
import ImageUrlField from "../_fields/ImageUrlField";
import { NodeEditorContext } from "../../stores/node-editor-stores/NodeEditorContext";

export default function NodeTemplateRenderer() {
  const { values } = useFormikContext<NodeTemplate>();
  const { currentVisualLayoutPath } = useNodeEditorContext();

  const fields = values.fields;
  const layout = get(values, currentVisualLayoutPath) as LayoutElement;

  if (!layout) {
    return <div className="text-gray-500 text-sm">Rien à afficher</div>;
  }

  return <LayoutRenderer element={layout} fields={fields} />;
}

function LayoutRenderer({
  element,
  fields,
}: {
  element: LayoutElement;
  fields: NodeField[];
}) {
  const style = element.style as CSSProperties | undefined;
  const { selectedElementId } = useContext(NodeEditorContext);

  switch (element.element) {
    case "root":
      return (
        <div
          style={style}
          className="min-w-28 min-h-12 rounded border border-gray-300 bg-white overflow-clip"
        >
          {element.children?.map((child) => (
            <LayoutRenderer key={child.id} element={child} fields={fields} />
          ))}
        </div>
      );

    case "div":
      return (
        <div style={style}>
          {element.children?.map((child) => (
            <LayoutRenderer key={child.id} element={child} fields={fields} />
          ))}
        </div>
      );

    case "field": {
      // Trouver le champ correspondant par son id
      const field = fields.find((f) => f.id === element.id);
      if (!field) {
        return (
          <div
            style={style}
            className="text-red-500 text-xs border border-red-300 p-1 rounded"
          >
            Field not found: {element.id}
          </div>
        );
      }
      return (
        <div
          style={style}
          className={
            selectedElementId === element.id
              ? "outline-2 outline-blue-400 rounded outline-offset-8"
              : ""
          }
        >
          <FieldRenderer field={field} visual={element.visual} />
        </div>
      );
    }

    case "separator":
      return (
        <hr style={{ borderColor: "#e5e7eb", ...style }} className="border-t" />
      );

    case "spacer":
      return (
        <div
          style={{ height: "8px", ...style }}
          className="spacer"
          aria-hidden="true"
        />
      );

    case "text":
      return (
        <div style={style} className="text-element">
          {element.data || ""}
        </div>
      );

    default:
      return (
        <div
          style={style}
          className="text-gray-400 text-xs border border-dashed p-1"
        >
          Unknown element: {element.element}
        </div>
      );
  }
}

function FieldRenderer({
  field,
  visual,
}: {
  field: NodeField;
  visual?: string;
}) {
  const renderFieldContent = () => {
    switch (field.type) {
      case "short_text":
        return (
          <ShortTextField field={field} isTemplatePreview visual={visual} />
        );

      case "rich_text":
        return (
          <div className="field-rich-text">
            <div className="text-xs text-gray-500 mb-1">{field.name}</div>
            <div className="border border-gray-300 rounded px-2 py-2 text-sm bg-white min-h-[60px]">
              Texte enrichi...
            </div>
          </div>
        );

      case "url":
        return <UrlField field={field} isTemplatePreview visual={visual} />;

      case "select":
        return (
          <div className="field-select">
            <div className="text-xs text-gray-500 mb-1">{field.name}</div>
            <div className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
              Sélection...
            </div>
          </div>
        );

      case "image":
      case "image_url":
        return (
          <ImageUrlField field={field} isTemplatePreview visual={visual} />
        );

      case "number":
        return (
          <div className="field-number">
            <div className="text-xs text-gray-500 mb-1">{field.name}</div>
            <div className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
              123
            </div>
          </div>
        );

      case "date":
        return (
          <div className="field-date">
            <div className="text-xs text-gray-500 mb-1">{field.name}</div>
            <div className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
              01/01/2025
            </div>
          </div>
        );

      case "boolean":
        return (
          <div className="field-boolean flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4" readOnly />
            <span className="text-sm">{field.name}</span>
          </div>
        );

      default:
        return (
          <div className="text-gray-400 text-xs">
            {field.name} ({field.type})
          </div>
        );
    }
  };

  return <div>{renderFieldContent()}</div>;
}
