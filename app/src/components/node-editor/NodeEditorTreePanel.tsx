import { useFormikContext } from "formik";
import { HiOutlineSquaresPlus } from "react-icons/hi2";
import { PiTextAa } from "react-icons/pi";
import { RiSeparator } from "react-icons/ri";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import TreeRenderer from "./TreeRenderer";

export default function NodeEditorTreePanel() {
  const { values, setFieldValue } = useFormikContext<NodeTemplate>();

  // Get the default node visual variant ID
  const defaultVariantId = values.default_visuals?.node || "default";
  const nodeVisual = values.visuals?.node?.[defaultVariantId];

  function addElementToLayout(element: LayoutElement) {
    if (!nodeVisual) return;

    // For simplicity, we add the new element as a child of the root
    const updatedLayout: LayoutElement = {
      ...nodeVisual.layout,
      children: [...(nodeVisual.layout.children || []), element],
    };
    // Use setFieldValue to update the layout in Formik state
    setFieldValue(`visuals.node.${defaultVariantId}.layout`, updatedLayout);
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
        gap: 8,
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

  return (
    <div className="space-y-4 border-gray-300 border-r px-5 py-4">
      <h3 className="font-semibold">Apparence du bloc</h3>
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

        {nodeVisual?.layout && <TreeRenderer layout={nodeVisual.layout} />}
      </div>
    </div>
  );
}
