import { HiOutlineXMark } from "react-icons/hi2";
import { Formik } from "formik";
import { get } from "lodash";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import NodeEditorLeftPanel from "./NodeEditorLeftPanel";
import NodeEditorTreePanel from "./NodeEditorTreePanel";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import { addElementToLayout, moveElementInLayout } from "../utils/editorUtils";
import { NodeEditorContext } from "../../stores/node-editor-stores/NodeEditorContext";

export default function NodeEditor() {
  const [currentVisualLayoutPath, setCurrentVisualLayoutPath] =
    useState<string>("visuals.node.default.layout");
  const [overElementId, setOverElementId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Distance minimale en pixels avant d'activer le drag
      },
    })
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

  // When item is dragged over the tree (TO DO LATER)
  function handleDragOver(e: DragOverEvent) {
    // console.log(e);
    // if (overElementId !== e.over?.id) {
    //   setOverElementId(e.over?.id ? String(e.over.id) : null);
    // }
  }

  // When item is dropped in the tree
  function handleDragEnd(
    event: DragEndEvent,
    values: NodeTemplate,
    setFieldValue: any
  ) {
    const { active, over } = event;
    if (!over) return console.log("No over element");
    console.log("Over ", over?.id);

    // Regarder si le targetElementId est root ou s'il contient div-. Si non, on ne fait rien
    if (over.id !== "root" && !String(over.id).startsWith("div-")) {
      return console.log("Not a valid drop target");
    }

    const action = active.data.current?.action;
    const nodeVisualLayoutToEdit = get(
      values,
      currentVisualLayoutPath
    ) as LayoutElement;

    // Ajout depuis le panel de gauche
    if (action === "add") {
      // Check if active.data.current.id is already in the layout to avoid duplicates
      const isDuplicate = nodeVisualLayoutToEdit.children?.some(
        (child) => child.id === active.data.current?.element?.id
      );
      if (isDuplicate) {
        console.log("Element is already in the layout");
        return;
      }

      // Add and update layout
      const updatedLayout = addElementToLayout(
        active.data.current?.element as LayoutElement,
        String(over.id),
        nodeVisualLayoutToEdit
      );
      console.log({ updatedLayout });
      setFieldValue(currentVisualLayoutPath, updatedLayout);
      console.log("Element added to layout");
    }

    // Réorganisation des éléments dans le tree
    else if (action === "sort") {
      const updatedLayout = moveElementInLayout(
        String(active.id),
        String(over.id),
        nodeVisualLayoutToEdit
      );
      console.log({ updatedLayout });
      setFieldValue(currentVisualLayoutPath, updatedLayout);
      console.log("Element moved in layout");
    }
  }

  return (
    <NodeEditorContext.Provider
      value={{
        overElementId,
        setOverElementId,
        currentVisualLayoutPath,
        setCurrentVisualLayoutPath,
        selectedElementId,
        setSelectedElementId,
      }}
    >
      <div className="rounded bg-white border-gray-300 border">
        {/* Header section */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-300">
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
                onDragOver={handleDragOver}
                sensors={sensors}
              >
                <div className="grid grid-cols-[minmax(0,310px)_minmax(0,310px)_auto]">
                  <NodeEditorLeftPanel />
                  <NodeEditorTreePanel />
                  <pre className="p-4 bg-gray-100 overflow-auto">
                    {JSON.stringify(values, null, 2)}
                  </pre>
                </div>
              </DndContext>
            );
          }}
        </Formik>
      </div>
    </NodeEditorContext.Provider>
  );
}
