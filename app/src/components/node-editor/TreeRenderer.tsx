import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";

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

function DivElement({ layout }: { layout: LayoutElement }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: layout.id,
    data: { type: "container", element: layout },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition, // Pas de transition pendant le drag
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border min-h-20 p-2 mb-2 bg-white relative"
    >
      <div
        className="text-xs text-gray-500 mb-1 cursor-grab active:cursor-grabbing bg-gray-100 px-2 py-1 rounded inline-block"
        {...attributes}
        {...listeners}
      >
        📦 {layout.element}
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
    data: { type: "field", element: layout },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition, // Pas de transition pendant le drag
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border min-h-10 p-2 mb-2 bg-blue-50"
      {...attributes}
      {...listeners}
    >
      <div className="text-xs text-gray-500">Field: {layout.id}</div>
    </div>
  );
}
