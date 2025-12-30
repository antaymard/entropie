import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import { getFieldFromId } from "../utils/editorUtils";
import { useFormikContext } from "formik";
import {
  deleteElementFromLayout,
  reorderElementAmongSiblings,
} from "../utils/editorUtils";
import { useNodeEditorContext } from "../../hooks/useNodeEditorContext";
import get from "lodash/get";
import { RxDragHandleDots2 } from "react-icons/rx";
import {
  HiMiniTrash,
  HiOutlineArrowSmallDown,
  HiOutlineArrowSmallUp,
} from "react-icons/hi2";

// Layout & Children are a LayoutElement type

export default function TreeRecursiveLayoutRenderer({
  layout,
}: {
  layout: LayoutElement;
}) {
  const { currentVisualLayoutPath } = useNodeEditorContext();
  const { values: nodeTemplate, setFieldValue } =
    useFormikContext<NodeTemplate>();

  const nodeVisualLayoutToEdit = get(
    nodeTemplate,
    currentVisualLayoutPath
  ) as LayoutElement;

  function handleDelete(elementId: string) {
    const updatedLayout = deleteElementFromLayout(
      elementId,
      nodeVisualLayoutToEdit
    );
    setFieldValue(currentVisualLayoutPath, updatedLayout);
  }

  function handleReorder(elementId: string, operation: "up" | "down") {
    const updatedLayout = reorderElementAmongSiblings(
      elementId,
      operation,
      nodeVisualLayoutToEdit
    );
    setFieldValue(currentVisualLayoutPath, updatedLayout);
  }

  switch (layout.element) {
    case "root":
      return <RootElement layout={layout} />;
    case "div":
      return (
        <DivElement
          layout={layout}
          nodeTemplate={nodeTemplate}
          handleDelete={handleDelete}
          handleReorder={handleReorder}
        />
      );
    case "field":
      return (
        <FieldElement
          layout={layout}
          nodeTemplate={nodeTemplate}
          handleDelete={handleDelete}
          handleReorder={handleReorder}
        />
      );
  }
}

// Root is only droppable, not draggable
function RootElement({ layout }: { layout: LayoutElement }) {
  const { selectedElementId, setSelectedElementId } = useNodeEditorContext();
  const isSelected = selectedElementId === layout.id;

  const { setNodeRef } = useDroppable({
    id: layout.id, // = root
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-md bg-gray-100 p-2 pb-5 ${
        isSelected ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-blue-200"
      }`}
      onClick={() => setSelectedElementId(layout.id)}
    >
      <div className="text-xs text-gray-500">Bloc</div>
      <SortableContext
        items={layout.children?.map((c) => c.id) || []}
        strategy={verticalListSortingStrategy}
      >
        {layout.children?.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-300 rounded">
            Glisser des champs ici
          </div>
        ) : (
          layout.children?.map((child) => (
            <TreeRecursiveLayoutRenderer key={child.id} layout={child} />
          ))
        )}
      </SortableContext>
    </div>
  );
}

// Div is droppable and draggable (sortable)
function DivElement({
  layout,
  handleDelete,
  handleReorder,
}: {
  layout: LayoutElement;
  nodeTemplate: NodeTemplate;
  handleDelete: (id: string) => void;
  handleReorder: (id: string, direction: "up" | "down") => void;
}) {
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

  const { selectedElementId, setSelectedElementId } = useNodeEditorContext();
  const isSelected = selectedElementId === layout.id;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: isDragging ? CSS.Transform.toString(transform) : undefined,
        transition: isDragging ? "none" : transition, // Pas de transition pendant le drag
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElementId(layout.id);
      }}
      className={`group rounded-md border border-gray-300 min-h-20 p-2 ${
        isSelected ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-blue-200"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div
          className="flex items-center gap-1 text-xs text-gray-500 cursor-grab active:cursor-grabbing bg-white px-2 py-1 rounded"
          {...attributes}
          {...listeners}
        >
          <RxDragHandleDots2 size={14} />
          Section
        </div>

        <OrganizeButtons
          layoutId={layout.id}
          handleDelete={handleDelete}
          handleReorder={handleReorder}
        />
      </div>

      <div className="mt-2 space-y-1">
        <SortableContext
          items={layout.children?.map((c) => c.id) || []}
          strategy={verticalListSortingStrategy}
        >
          {layout.children?.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">
              Glisser ici
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

function FieldElement({
  layout,
  nodeTemplate,
  handleDelete,
  handleReorder,
}: {
  layout: LayoutElement;
  nodeTemplate: NodeTemplate;
  handleDelete: (id: string) => void;
  handleReorder: (id: string, direction: "up" | "down") => void;
}) {
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

  const fieldDetails = getFieldFromId(layout.id, nodeTemplate);
  const { setSelectedElementId, selectedElementId } = useNodeEditorContext();
  const isSelected = selectedElementId === layout.id;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: isDragging ? CSS.Transform.toString(transform) : undefined,
        transition: isDragging ? "none" : transition, // Pas de transition pendant le drag
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElementId(layout.id);
      }}
      className={`group flex items-center justify-between text-gray-500 cursor-grab active:cursor-grabbing bg-white px-2 py-1 rounded ${
        isSelected ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-blue-200"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex gap-2 items-center text-gray-500 flex-1 min-w-0"
      >
        {fieldDetails?.fieldDefinition?.icon && (
          <fieldDetails.fieldDefinition.icon />
        )}
        <p className="truncate flex-1">{fieldDetails?.nodeField?.name}</p>
      </div>

      <OrganizeButtons
        layoutId={layout.id}
        handleDelete={handleDelete}
        handleReorder={handleReorder}
      />
    </div>
  );
}

function OrganizeButtons({
  layoutId,
  handleDelete,
  handleReorder,
}: {
  layoutId: string;
  handleDelete: (id: string) => void;
  handleReorder: (id: string, direction: "up" | "down") => void;
}) {
  return (
    <div className="flex items-center justify-between gap-1">
      {/* Bouton pour up l'element among siblings, un up, un down, et on laisse le delete */}
      <button
        type="button"
        className="text-gray-400 hidden group-hover:block hover:text-text"
        onClick={() => handleReorder(layoutId, "up")}
      >
        <HiOutlineArrowSmallUp size={18} />
      </button>
      <button
        type="button"
        className="text-gray-400 hidden group-hover:block hover:text-text"
        onClick={() => handleReorder(layoutId, "down")}
      >
        <HiOutlineArrowSmallDown size={18} />
      </button>
      <button
        type="button"
        className="text-gray-400 hidden group-hover:block hover:text-pink-400"
        onClick={() => handleDelete(layoutId)}
      >
        <HiMiniTrash size={18} />
      </button>
    </div>
  );
}
