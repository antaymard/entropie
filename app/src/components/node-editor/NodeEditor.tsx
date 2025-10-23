import { HiOutlineXMark } from "react-icons/hi2";
import { Formik } from "formik";
import { get } from "lodash";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import type { DragEndEvent } from "@dnd-kit/core";
import NodeEditorLeftPanel from "./NodeEditorLeftPanel";
import NodeEditorTreePanel from "./NodeEditorTreePanel";
import { DndContext } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useState } from "react";

export default function NodeEditor() {
  const [visualToEditPath, setVisualToEditPath] = useState<string>(
    "visuals.node.default.layout"
  );

  const initialValues: NodeTemplate = {
    name: "",
    description: "",
    icon: "",
    is_system: false,
    user_id: null,
    fields: [],
    visuals: {
      node: {
        default: {
          name: "Nouveau visuel",
          description: "Description du visuel",
          layout: { element: "root", children: [], id: "root" },
        },
      },
      window: {},
    },
    default_visuals: {
      node: "default",
      window: "",
    },
  };

  const handleSaveTemplate = (values: NodeTemplate) => {
    console.log("Form submitted:", values);
  };

  function handleAddElementToLayout(
    elementToAdd: LayoutElement,
    targetElementId: string,
    layout: LayoutElement
  ): LayoutElement {
    // Regarder si le targetElementId est root ou s'il contient div-. Si non, on ne fait rien
    if (targetElementId !== "root" && !targetElementId.startsWith("div-")) {
      return layout;
    }

    const findAndAddElement = (currentLayout: LayoutElement): LayoutElement => {
      if (currentLayout.id === targetElementId) {
        // Si on a trouvé l'élément cible, on l'ajoute
        return {
          ...currentLayout,
          children: [...(currentLayout.children || []), elementToAdd],
        };
      }

      // Sinon, on cherche dans les enfants
      if (currentLayout.children) {
        return {
          ...currentLayout,
          children: currentLayout.children.map((child) =>
            findAndAddElement(child)
          ),
        };
      }

      return currentLayout;
    };

    return findAndAddElement(layout);
  }

  function handleDragEnd(
    event: DragEndEvent,
    values: NodeTemplate,
    setFieldValue: any
  ) {
    const { active, over } = event;
    if (!over) return console.log("No over element");
    console.log({ active, over });

    // Ajout depuis le panel de gauche
    if (active?.data?.current?.action === "add") {
      const nodeVisualLayoutToEdit = get(
        values,
        visualToEditPath
      ) as LayoutElement;

      // Check if active.data.current.id is already in the layout to avoid duplicates
      const isDuplicate = nodeVisualLayoutToEdit.children?.some(
        (child) => child.id === active.data.current?.element?.id
      );
      if (isDuplicate) {
        console.log("Element is already in the layout");
        return;
      }

      const updatedLayout = handleAddElementToLayout(
        active.data.current.element as LayoutElement,
        String(over.id),
        nodeVisualLayoutToEdit
      );
      console.log({ updatedLayout });
      setFieldValue(visualToEditPath, updatedLayout);
      console.log("Element added to layout");
    }
  }

  return (
    <div className="rounded bg-white border-gray-300 border-2">
      {/* Header section */}
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-gray-300">
        <h2 className="font-semibold text-lg">
          <span className="text-xl">🔧</span> Éditeur de blocs
        </h2>
        <button
          type="button"
          className="hover:bg-gray-100 cursor-pointer"
          onClick={() => console.log("close")}
        >
          <HiOutlineXMark size={20} />
        </button>
      </div>

      {/* Form section */}
      <Formik initialValues={initialValues} onSubmit={handleSaveTemplate}>
        {({ values, setFieldValue }) => {
          return (
            <DndContext
              onDragEnd={(e) => handleDragEnd(e, values, setFieldValue)}
            >
              <div className="grid grid-cols-[minmax(0,310px)_minmax(0,310px)_auto]">
                <NodeEditorLeftPanel />
                <NodeEditorTreePanel />
                <pre className="p-4 bg-gray-50 overflow-auto">
                  {JSON.stringify(values, null, 2)}
                </pre>
              </div>
            </DndContext>
          );
        }}
      </Formik>
    </div>
  );
}
