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
import type { Node } from "@xyflow/react";
import fieldsDefinition from "../fields/fieldsDefinition";
import type { FieldType } from "../../types/field.types";

// Mapping des composants pour chaque type de field
const FIELD_COMPONENTS_MAP: Record<
  FieldType,
  React.ComponentType<{
    field: NodeField;
    isTemplatePreview: boolean;
    visual?: string;
  }>
> = {
  short_text: ShortTextField,
  url: UrlField,
  image: ImageUrlField,
  image_url: ImageUrlField,
  rich_text: ShortTextField, // Fallback temporaire
  select: ShortTextField, // Fallback temporaire
  number: ShortTextField, // Fallback temporaire
  date: ShortTextField, // Fallback temporaire
  boolean: ShortTextField, // Fallback temporaire
};

export default function NodeTemplateRenderer() {
  const { values } = useFormikContext<NodeTemplate>();
  const { currentVisualLayoutPath } = useNodeEditorContext();

  const fields = values.fields;
  const layout = get(values, currentVisualLayoutPath) as LayoutElement;

  if (!layout) {
    return <div className="text-gray-500 text-sm">Rien à afficher</div>;
  }

  return <LayoutRenderer element={layout} fields={fields} node={null} />;
}

function LayoutRenderer({
  element,
  fields,
  node,
}: {
  element: LayoutElement;
  fields: NodeField[];
  node?: Node | null;
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
  // Trouver la définition du field dans fieldsDefinition
  const fieldDef = fieldsDefinition.find((def) => def.type === field.type);

  // Récupérer le composant correspondant depuis le mapping
  const FieldComponent = FIELD_COMPONENTS_MAP[field.type];

  // Si le composant existe, l'utiliser
  if (FieldComponent) {
    return <FieldComponent field={field} isTemplatePreview visual={visual} />;
  }

  // Fallback si le type n'est pas reconnu
  return (
    <div className="text-gray-400 text-xs">
      {field.name} ({field.type}) - Composant non trouvé
      {fieldDef && ` (${fieldDef.label})`}
    </div>
  );
}
