import { memo, useCallback, type CSSProperties } from "react";
import type {
  LayoutElement,
  NodeTemplate,
  NodeField,
} from "../../types/node.types";
import { useNodeEditorContext } from "../../hooks/useNodeEditorContext";
import fieldsDefinition from "../fields/fieldsDefinition";
import { get } from "lodash";
import { useFormikContext } from "formik";

// ===========================================================================
// Props du renderer principal
// ===========================================================================

interface NodeTemplateRendererProps {
  template: NodeTemplate;
  visualType: "node" | "window";
  nodeData?: Record<string, unknown>;
  onSaveNodeData?: (fieldId: string, value: unknown) => void; // undefined = preview
}

// ===========================================================================
// Composant principal - OPTIMISÉ avec memo
// ===========================================================================

function NodeTemplateRenderer({
  template,
  visualType,
  nodeData,
  onSaveNodeData,
}: NodeTemplateRendererProps) {
  const layout = template.visuals[visualType]?.default?.layout;
  const fields = template.fields;

  if (!layout) {
    return <div className="text-gray-500 text-sm">Aucun layout défini</div>;
  }

  return (
    <LayoutRenderer
      element={layout}
      fields={fields}
      visualType={visualType}
      nodeData={nodeData}
      onSaveNodeData={onSaveNodeData}
    />
  );
}

export default memo(NodeTemplateRenderer);

// ===========================================================================
// Version pour l'éditeur de template (utilise Formik)
// ===========================================================================

export function NodeTemplateRendererEditor() {
  const { values } = useFormikContext<NodeTemplate>();
  const { currentVisualLayoutPath } = useNodeEditorContext();

  const fields = values.fields;
  const layout = get(values, currentVisualLayoutPath) as LayoutElement;

  if (!layout) {
    return <div className="text-gray-500 text-sm">Rien à afficher</div>;
  }

  return (
    <LayoutRenderer
      element={layout}
      fields={fields}
      visualType="node"
      nodeData={undefined}
      onSaveNodeData={undefined}
    />
  );
}

// ===========================================================================
// Renderer récursif pour les éléments de layout - OPTIMISÉ avec memo
// ===========================================================================

interface LayoutRendererProps {
  element: LayoutElement;
  fields: NodeField[];
  visualType: "node" | "window";
  nodeData?: Record<string, unknown>;
  onSaveNodeData?: (fieldId: string, value: unknown) => void;
}

const LayoutRenderer = memo(function LayoutRenderer({
  element,
  fields,
  visualType,
  nodeData,
  onSaveNodeData,
}: LayoutRendererProps) {
  const style = element.style as CSSProperties | undefined;
  const { selectedElementId } = useNodeEditorContext();

  switch (element.element) {
    case "root":
      return (
        <div
          style={style}
          className="min-w-28 min-h-12 rounded border border-gray-300 bg-white overflow-clip"
        >
          {element.children?.map((child) => (
            <LayoutRenderer
              key={child.id}
              element={child}
              fields={fields}
              visualType={visualType}
              nodeData={nodeData}
              onSaveNodeData={onSaveNodeData}
            />
          ))}
        </div>
      );

    case "div":
      return (
        <div style={style}>
          {element.children?.map((child) => (
            <LayoutRenderer
              key={child.id}
              element={child}
              fields={fields}
              visualType={visualType}
              nodeData={nodeData}
              onSaveNodeData={onSaveNodeData}
            />
          ))}
        </div>
      );

    case "field": {
      return (
        <FieldRendererWrapper
          elementId={element.id}
          fields={fields}
          visualType={visualType}
          visualSettings={element.visual?.settings}
          nodeData={nodeData}
          onSaveNodeData={onSaveNodeData}
          style={style}
          isSelected={selectedElementId === element.id}
        />
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
          Élément inconnu: {element.element}
        </div>
      );
  }
});

// ===========================================================================
// Wrapper pour le field renderer - OPTIMISÉ avec memo
// ===========================================================================

interface FieldRendererWrapperProps {
  elementId: string;
  fields: NodeField[];
  visualType: "node" | "window";
  visualSettings?: Record<string, unknown>;
  nodeData?: Record<string, unknown>;
  onSaveNodeData?: (fieldId: string, value: unknown) => void;
  style?: CSSProperties;
  isSelected?: boolean;
}

const FieldRendererWrapper = memo(function FieldRendererWrapper({
  elementId,
  fields,
  visualType,
  visualSettings,
  nodeData,
  onSaveNodeData,
  style,
  isSelected,
}: FieldRendererWrapperProps) {
  const handleChange = useCallback(
    (newValue: unknown) => {
      if (onSaveNodeData) {
        onSaveNodeData(elementId, newValue);
      }
    },
    [onSaveNodeData, elementId]
  );

  const field = fields.find((f) => f.id === elementId);

  if (!field) {
    return (
      <div
        style={style}
        className="text-red-500 text-xs border border-red-300 p-1 rounded"
      >
        Field non trouvé: {elementId}
      </div>
    );
  }

  const fieldDef = fieldsDefinition.find((def) => def.type === field.type);

  if (!fieldDef || !fieldDef.visuals) {
    return (
      <div style={style} className="text-gray-400 text-xs">
        {field.name} ({field.type}) - Définition non trouvée
      </div>
    );
  }

  const visualConfig = fieldDef.visuals[visualType]?.default;

  if (!visualConfig) {
    return (
      <div style={style} className="text-gray-400 text-xs">
        {field.name} - Aucun visual défini pour {visualType}
      </div>
    );
  }

  const FieldComponent = visualConfig.component;
  const value = nodeData?.[field.id];

  return (
    <div
      style={style}
      className={
        isSelected ? "outline-2 outline-blue-400 rounded outline-offset-8" : ""
      }
    >
      <FieldComponent
        field={field}
        value={value}
        onChange={onSaveNodeData ? handleChange : undefined}
        visualSettings={visualSettings}
      />
    </div>
  );
});
