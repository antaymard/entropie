import { HiOutlineXMark } from "react-icons/hi2";
import { Formik } from "formik";
import { get, min } from "lodash";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import NodeEditorLeftPanel from "./NodeEditorLeftPanel";
import NodeEditorTreePanel from "./NodeEditorTreePanel";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { addElementToLayout, moveElementInLayout } from "../utils/editorUtils";
import { NodeEditorContext } from "../../stores/node-editor-stores/NodeEditorContext";
import NodeEditorRightPanel from "./NodeEditorRightPanel";
import NodeEditorPreviewPanel from "./NodeEditorPreviewPanel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import toast from "react-hot-toast";

export default function NodeEditor({
  templateId,
}: {
  templateId: Id<"nodeTemplates"> | "new";
}) {
  const [currentVisualLayoutPath, setCurrentVisualLayoutPath] =
    useState<string>("visuals.node.default.layout");
  const [overElementId, setOverElementId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const createOrUpdateTemplate = useMutation(
    api.templates.createOrUpdateTemplate
  );
  const template = useQuery(
    api.templates.getTemplateById,
    templateId === "new" ? "skip" : { templateId }
  ) as NodeTemplate | undefined;

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
    isSystem: false,
    creatorId: null,
    fields: [],
    visuals: {
      node: {
        default: {
          name: "Nouveau visuel",
          description: "Description du visuel",
          layout: {
            element: "root",
            children: [],
            id: "root",
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              width: "300px",
              minHeight: "100px",
            },
          },
        },
      },
      window: {},
    },
    defaultVisuals: {
      node: "default",
      window: "",
    },
  };

  const handleSaveTemplate = async (values: NodeTemplate) => {
    // return console.log(values);

    await createOrUpdateTemplate({ templateId, data: values });
    toast.success("Template sauvegardé avec succès !");
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

  if (template === undefined && templateId !== "new") return null;

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
      {/* Form section */}
      <Formik
        initialValues={template || initialValues}
        onSubmit={handleSaveTemplate}
      >
        {({ values, setFieldValue, handleSubmit }) => {
          return (
            <div className="h-full flex flex-col gap-2">
              <div className="flex flex-col rounded-md border-gray-300 border flex-1">
                <DndContext
                  onDragEnd={(e) => handleDragEnd(e, values, setFieldValue)}
                  onDragOver={handleDragOver}
                  sensors={sensors}
                >
                  <div className="grid grid-cols-[minmax(0,310px)_minmax(0,310px)_auto_minmax(0,350px)] h-full">
                    <NodeEditorLeftPanel />
                    <NodeEditorTreePanel />
                    <NodeEditorPreviewPanel />
                    <NodeEditorRightPanel />
                  </div>
                </DndContext>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white w-fit rounded-sm"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          );
        }}
      </Formik>
    </NodeEditorContext.Provider>
  );
}
