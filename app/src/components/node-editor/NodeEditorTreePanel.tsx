import { useFormikContext } from "formik";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
      <div className="h-80 bg-amber-100">
        {nodeVisual?.layout && <LayoutRenderer layout={nodeVisual.layout} />}
      </div>
    </div>
  );
}

function LayoutRenderer({ layout }: { layout: LayoutElement }) {
  const { setNodeRef } = useDroppable({ id: layout.id });

  function renderTreeItem() {
    switch (layout.element) {
      case "root":
        return <RootElement layout={layout} />;
      case "div":
        return <SortableElement layout={layout} />;
      case "field":
        return <p>Field Element</p>;
    }
  }

  return renderTreeItem();
}

function RootElement({ layout }: { layout: LayoutElement }) {
  const { setNodeRef } = useDroppable({ id: "root" });
  return (
    <div ref={setNodeRef} className="border min-h-20 p-2">
      {layout.element}
      {layout.children?.map((child) => (
        <LayoutRenderer key={child.id} layout={child} />
      ))}
    </div>
  );
}

function SortableElement({ layout }: { layout: LayoutElement }) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: layout.id,
  });

  return (
    <div
      className="border min-h-20 p-2"
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
      }}
    >
      {layout.element}
      {layout.children?.map((child) => (
        <LayoutRenderer key={child.id} layout={child} />
      ))}
    </div>
  );
}

// function ContainerElement() {
//   const { attributes, listeners, setNodeRef, transform } = useSortable({
//     id: layout.id,
//     data: {
//       type: "container",
//       element: layout,
//     },
//   });
//   return (
//     <div
//       className="border min-h-20 p-2"
//       // aria-disabled={layout.element === "root"}
//       ref={setNodeRef}
//     >
//       {layout.element}
//       {layout.children?.map((child) => (
//         <LayoutRenderer key={child.id} layout={child} />
//       ))}
//     </div>
//   );
// }
