import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import { getFieldDetailsFromId } from "../utils/nodeUtils";
import { useFormikContext } from "formik";
import { deleteElementFromLayout } from "../utils/editorUtils";
import { useNodeEditorContext } from "../../hooks/useNodeEditorContext";
import { get } from "lodash";

// Layout & Children are a LayoutElement type

export default function TreeRecursiveLayoutRenderer({
  layout,
}: {
  layout: LayoutElement;
}) {
  switch (layout.element) {
    case "root":
      return <RootElement layout={layout} />;
    case "div":
      return <DivElement layout={layout} />;
    case "field":
      return <FieldElement layout={layout} />;
  }
}

// Root is only droppable, not draggable
function RootElement({ layout }: { layout: LayoutElement }) {
  const { setNodeRef } = useDroppable({
    id: layout.id, // = root
  });

  return (
    <div ref={setNodeRef} className="border min-h-20 p-2">
      <div className="text-xs text-gray-500 mb-1">{layout.element}</div>
      <SortableContext
        items={layout.children?.map((c) => c.id) || []}
        strategy={verticalListSortingStrategy}
      >
        {layout.children?.map((child) => (
          <TreeRecursiveLayoutRenderer key={child.id} layout={child} />
        ))}
      </SortableContext>
    </div>
  );
}

// Div is droppable and draggable (sortable)
function DivElement({ layout }: { layout: LayoutElement }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: layout.id, // div-abc123
    data: { type: "container", element: layout, action: "sort" },
  });

  const { currentVisualLayoutPath } = useNodeEditorContext();
  const { values, setFieldValue } = useFormikContext<NodeTemplate>();

  const nodeVisualLayoutToEdit = get(
    values,
    currentVisualLayoutPath
  ) as LayoutElement;

  function handleDelete(elementId: string) {
    const updatedLayout = deleteElementFromLayout(
      elementId,
      nodeVisualLayoutToEdit
    );
    setFieldValue(currentVisualLayoutPath, updatedLayout);
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: isDragging ? CSS.Transform.toString(transform) : undefined,
        // transition: isDragging ? "none" : transition, // Pas de transition pendant le drag
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border min-h-20 p-2 mb-2 bg-white relative"
    >

      <div className="flex items-center justify-between mb-1">
        <div
          className="text-xs text-gray-500 cursor-grab active:cursor-grabbing bg-gray-100 px-2 py-1 rounded inline-block"
          {...attributes}
          {...listeners}
        >
          📦 {layout.element}
        </div>
        <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => handleDelete(layout.id)}>
          🗑️
        </button>
      </div>

      <div className="mt-2">
        <SortableContext
          items={layout.children?.map((c) => c.id) || []}
          strategy={verticalListSortingStrategy}
        >
          {layout.children?.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-300 rounded">
              Drop items here
            </div>
          ) : (
            layout.children?.map((child) => (
              <TreeRecursiveLayoutRenderer key={child.id} layout={child} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function FieldElement({ layout }: { layout: LayoutElement }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: layout.id,
    data: { type: "field", element: layout, action: "sort" }, // ???
  });

  const { values: nodeTemplate } = useFormikContext<NodeTemplate>();
  const fieldDetails = getFieldDetailsFromId(layout.id, nodeTemplate);

  const { currentVisualLayoutPath } = useNodeEditorContext();
  const { values, setFieldValue } = useFormikContext<NodeTemplate>();

  const nodeVisualLayoutToEdit = get(
    values,
    currentVisualLayoutPath
  ) as LayoutElement;

  function handleDelete(elementId: string) {
    const updatedLayout = deleteElementFromLayout(
      elementId,
      nodeVisualLayoutToEdit
    );
    setFieldValue(currentVisualLayoutPath, updatedLayout);
  }


  return (
    <div
      ref={setNodeRef}
      style={{
        transform: isDragging ? CSS.Transform.toString(transform) : undefined,
        transition: isDragging ? "none" : transition, // Pas de transition pendant le drag
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border flex items-center justify-between min-h-10 p-2 mb-2 bg-blue-50 cursor-grab active:cursor-grabbing"

    >
      <div {...attributes}
        {...listeners} className="flex gap-2 items-center text-gray-500">
        {fieldDetails?.icon && <fieldDetails.icon />}
        {fieldDetails?.nodeField.name}
      </div>
      <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => handleDelete(layout.id)}>
        🗑️
      </button>
    </div>
  );
}
