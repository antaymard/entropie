import { useFormikContext } from "formik";
import { HiOutlineSquaresPlus } from "react-icons/hi2";
import { PiTextAa } from "react-icons/pi";
import { RiSeparator } from "react-icons/ri";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import TreeRenderer from "./TreeRenderer";
import { useNodeEditorContext } from "@/hooks/useNodeEditorContext";

export default function NodeEditorTreePanel() {
  const { values, setFieldValue } = useFormikContext<NodeTemplate>();
  const { currentVisualLayoutPath } = useNodeEditorContext();

  // Déterminer le type de visuel (node ou window) depuis le path
  const visualType = currentVisualLayoutPath.includes("visuals.window")
    ? "window"
    : "node";

  // Get the default visual variant ID based on visualType
  const defaultVariantId = values.defaultVisuals?.[visualType] || "default";
  const visual = values.visuals?.[visualType]?.[defaultVariantId];

  function addElementToLayout(element: LayoutElement) {
    if (!visual) return;

    // For simplicity, we add the new element as a child of the root
    const updatedLayout: LayoutElement = {
      ...visual.layout,
      children: [
        ...(visual.layout.children || []),
        { ...element, visual: { name: "default", settings: {} } },
      ],
    };
    // Use setFieldValue to update the layout in Formik state
    setFieldValue(`visuals.${visualType}.${defaultVariantId}.layout`, updatedLayout);
  }

  const staticElements = [
    {
      element: "div" as const,
      label: "Section",
      icon: HiOutlineSquaresPlus,
      prefix: "div-",
      defaultStyle: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        justifyContent: "start",
      },
    },
    {
      element: "text" as const,
      label: "Texte statique",
      icon: PiTextAa,
      prefix: "txt-",
      disabled: true,
    },
    {
      element: "separator" as const,
      label: "Séparateur",
      icon: RiSeparator,
      prefix: "sep-",
      disabled: true,
    },
  ];

  const panelTitle = visualType === "node" ? "Apparence du bloc" : "Apparence de la fenêtre";

  return (
    <div className="space-y-4 border-gray-300 border-r px-5 py-4">
      <h3 className="font-semibold">{panelTitle}</h3>
      {/* Disposition elements */}
      <div className="">
        <h4 className="text-sm font-medium mb-2">
          Ajouter un élément de mise en page
        </h4>

        <div className="flex flex-wrap gap-1 mb-4">
          {staticElements.map(
            (
              { element, label, icon: Icon, prefix, disabled, defaultStyle },
              i
            ) => (
              <button
                key={i}
                type="button"
                disabled={disabled}
                className="text-sm flex items-center gap-1 border border-gray-300 rounded px-2 py-1 hover:bg-gray-100"
                onClick={() =>
                  addElementToLayout({
                    id: prefix + Math.random().toString(36).slice(2, 9),
                    element,
                    children: [],
                    style: defaultStyle || {},
                  })
                }
              >
                <Icon size={16} />
                {label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="">
        <h4 className="text-sm font-medium mb-2">Structure du bloc</h4>

        {visual?.layout && <TreeRenderer layout={visual.layout} />}
      </div>
    </div>
  );
}
