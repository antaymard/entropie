import { useFormikContext } from "formik";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
  switch (layout.element) {
    case "root":
      return <RootElement layout={layout} />;
    case "div":
      return <DivElement layout={layout} />;
    case "field":
      return <FieldElement layout={layout} />;
  }
}

function RootElement({ layout }: { layout: LayoutElement }) {
  const { setNodeRef } = useDroppable({ id: layout.id });

  return (
    <div ref={setNodeRef} className="border min-h-20 p-2">
      <div className="text-xs text-gray-500 mb-1">{layout.element}</div>
      <SortableContext
        items={layout.children?.map((c) => c.id) || []}
        strategy={verticalListSortingStrategy}
      >
        {layout.children?.map((child) => (
          <LayoutRenderer key={child.id} layout={child} />
        ))}
      </SortableContext>
    </div>
  );
}

function DivElement({ layout }: { layout: LayoutElement }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: layout.id,
    });
  const { setNodeRef: setDropRef } = useDroppable({ id: layout.id });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="border min-h-20 p-2 mb-2 bg-white"
      {...attributes}
      {...listeners}
    >
      <div className="text-xs text-gray-500 mb-1">{layout.element}</div>
      <SortableContext
        items={layout.children?.map((c) => c.id) || []}
        strategy={verticalListSortingStrategy}
      >
        {layout.children?.map((child) => (
          <LayoutRenderer key={child.id} layout={child} />
        ))}
      </SortableContext>
    </div>
  );
}

function FieldElement({ layout }: { layout: LayoutElement }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: layout.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
      }}
      className="border min-h-10 p-2 mb-2 bg-blue-50"
      {...attributes}
      {...listeners}
    >
      <div className="text-xs text-gray-500">Field: {layout.id}</div>
    </div>
  );
}
