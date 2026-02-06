import { memo, useCallback, type CSSProperties } from "react";
import type {
  LayoutElement,
  NodeTemplate,
  NodeField,
} from "../../types/node.types";
import {
  useNodeEditorContext,
  useOptionalNodeEditorContext,
} from "../../hooks/useNodeEditorContext";
import fieldsDefinition from "../fields/fieldsDefinition";
import get from "lodash/get";
import { useFormikContext } from "formik";

// ===========================================================================
// Props du renderer principal
// ===========================================================================

interface CustomTemplateRendererProps {
  template: NodeTemplate;
  visualType: "node" | "window";
  nodeData?: Record<string, unknown>;
  onSaveNodeData?: (fieldId: string, value: unknown) => void; // undefined = preview
}

// ===========================================================================
// Composant principal - OPTIMISÉ avec memo
// ===========================================================================

function CustomTemplateRenderer({
  template,
  visualType,
  nodeData,
  onSaveNodeData,
}: CustomTemplateRendererProps) {
  // Récupérer l'ID du variant par défaut pour ce visualType
  const defaultVariantId = template.defaultVisuals[visualType] || "default";
  const layout = template.visuals[visualType]?.[defaultVariantId]?.layout;
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

export default memo(CustomTemplateRenderer, (prevProps, nextProps) => {
  // Comparaison optimisée pour le canvas
  // On compare uniquement ce qui affecte vraiment le rendu

  // Si le template ID a changé, on doit re-render
  if (prevProps.template._id !== nextProps.template._id) return false;

  // Si le visualType change (node <-> window), on doit re-render
  if (prevProps.visualType !== nextProps.visualType) return false;

  // Si les données du node ont changé, on doit re-render
  // Utiliser une comparaison légère - seulement les clés et valeurs primitives
  const prevDataKeys = Object.keys(prevProps.nodeData || {}).sort();
  const nextDataKeys = Object.keys(nextProps.nodeData || {}).sort();

  if (prevDataKeys.length !== nextDataKeys.length) return false;
  if (prevDataKeys.join(",") !== nextDataKeys.join(",")) return false;

  // Comparer les valeurs pour chaque clé
  for (const key of prevDataKeys) {
    if (prevProps.nodeData?.[key] !== nextProps.nodeData?.[key]) return false;
  }

  // Si rien n'a changé, on peut éviter le re-render
  return true;
});

// ===========================================================================
// Version pour l'éditeur de template (utilise Formik)
// ===========================================================================

export function NodeTemplateRendererEditor() {
  const { values } = useFormikContext<NodeTemplate>();
  const { currentVisualLayoutPath } = useNodeEditorContext();
  const fields = values.fields;
  const layout = get(values, currentVisualLayoutPath) as LayoutElement;

  // Déterminer le visualType en fonction du path
  const visualType = currentVisualLayoutPath.includes("visuals.window")
    ? "window"
    : "node";

  if (!layout) {
    return <div className="text-gray-500 text-sm">Rien à afficher</div>;
  }

  return (
    <LayoutRenderer
      element={layout}
      fields={fields}
      visualType={visualType}
      nodeData={undefined}
      onSaveNodeData={undefined}
      componentProps={undefined}
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

function LayoutRenderer({
  element,
  fields,
  visualType,
  nodeData,
  onSaveNodeData,
}: LayoutRendererProps) {
  const style = element.style as CSSProperties | undefined;
  const editorContext = useOptionalNodeEditorContext();
  const selectedElementId = editorContext?.selectedElementId;

  switch (element.element) {
    case "root":
      // Filter out minWidth and minHeight from style for root element
      // (these are now stored in data as defaultWidth/defaultHeight)
      const { minWidth, minHeight, ...rootStyle } = style || {};
      return (
        <div
          style={rootStyle}
          // className="min-w-28 min-h-12 rounded border border-gray-300 bg-white overflow-clip"
          className="h-full"
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
          visualName={element.visual?.name}
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
          {typeof element.data === "string" ? element.data : ""}
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
}

// ===========================================================================
// Wrapper pour le field renderer - OPTIMISÉ avec memo
// ===========================================================================

interface FieldRendererWrapperProps {
  elementId: string;
  fields: NodeField[];
  visualType: "node" | "window";
  visualName?: string;
  visualSettings?: Record<string, unknown>;
  nodeData?: Record<string, unknown>;
  onSaveNodeData?: (fieldId: string, value: unknown) => void;
  style?: CSSProperties;
  isSelected?: boolean;
}

const FieldRendererWrapper = memo(
  function FieldRendererWrapper({
    elementId,
    fields,
    visualType,
    visualName,
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

    // Trouver le variant qui correspond au visualType ET au visualName demandés
    const targetVariantName = visualName || "default";
    const visualVariant = fieldDef.visuals.variants.find(
      (variant) =>
        variant.name === targetVariantName &&
        (variant.visualType === visualType || variant.visualType === "both")
    );
    const componentProps = visualVariant?.componentProps || {};

    if (!visualVariant) {
      return (
        <div style={style} className="text-gray-400 text-xs">
          {field.name} - Aucun visual "{targetVariantName}" défini pour{" "}
          {visualType}
        </div>
      );
    }

    const FieldComponent = visualVariant.component;
    const value = nodeData?.[field.id];

    return (
      <div
        style={style}
        className={
          isSelected
            ? "outline-2 outline-blue-400 rounded outline-offset-8"
            : ""
        }
      >
        <FieldComponent
          visualType={visualType}
          componentProps={componentProps}
          field={field}
          value={value}
          onChange={onSaveNodeData ? handleChange : undefined}
          visualSettings={visualSettings}
        />
      </div>
    );
  },
  // Fonction de comparaison personnalisée pour memo
  (prevProps, nextProps) => {
    // Trouver le field correspondant dans les deux versions
    const prevField = prevProps.fields.find(
      (f) => f.id === prevProps.elementId
    );
    const nextField = nextProps.fields.find(
      (f) => f.id === nextProps.elementId
    );

    // Si le field a changé (notamment son name ou ses options), on doit re-render
    if (prevField?.name !== nextField?.name) return false;
    if (prevField?.type !== nextField?.type) return false;
    if (
      JSON.stringify(prevField?.options) !== JSON.stringify(nextField?.options)
    )
      return false;

    // Vérifier les autres props importantes
    if (prevProps.elementId !== nextProps.elementId) return false;
    if (prevProps.visualType !== nextProps.visualType) return false;
    if (prevProps.visualName !== nextProps.visualName) return false;
    if (prevProps.isSelected !== nextProps.isSelected) return false;
    if (
      JSON.stringify(prevProps.visualSettings) !==
      JSON.stringify(nextProps.visualSettings)
    )
      return false;
    if (
      JSON.stringify(prevProps.nodeData?.[prevProps.elementId]) !==
      JSON.stringify(nextProps.nodeData?.[nextProps.elementId])
    )
      return false;

    // Si rien n'a changé, on peut éviter le re-render
    return true;
  }
);
