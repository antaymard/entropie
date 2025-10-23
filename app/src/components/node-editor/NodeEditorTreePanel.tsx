import { useFormikContext } from "formik";

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

  return (
    <div className="border-gray-300 border-r-2 px-5 py-4">
      {/* Disposition elements */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            addElementToLayout({
              id: "div-" + Math.random().toString(36).slice(2, 9),
              element: "div",
              children: [],
            })
          }
        >
          Ajout container
        </button>
      </div>

      <h3 className="font-semibold">Apparence du bloc</h3>
      <div className="min-h-80 bg-amber-100">
        {nodeVisual?.layout && <TreeRenderer layout={nodeVisual.layout} />}
      </div>
    </div>
  );
}
