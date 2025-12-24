import { Formik } from "formik";
import { get } from "lodash";

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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const createOrUpdateTemplate = useMutation(
    api.templates.createOrUpdateTemplate
  );
  const { template } =
    (useQuery(
      api.templates.getTemplateById,
      templateId === "new" ? "skip" : { templateId }
    ) as NodeTemplate | undefined) || {};

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
              paddingTop: "10px",
              paddingBottom: "10px",
              paddingRight: "10px",
              paddingLeft: "10px",
              gap: "8px",
            },
            data: {
              resizable: true,
              headerless: false,
              disableDoubleClickToOpenWindow: false,
            },
          },
        },
      },
      window: {
        default: {
          name: "Visuel fenêtre par défaut",
          description: "Apparence de la fenêtre",
          layout: {
            element: "root",
            children: [],
            id: "root",
            style: {
              display: "flex",
              flexDirection: "column",
              paddingTop: "16px",
              paddingBottom: "16px",
              paddingRight: "16px",
              paddingLeft: "16px",
              gap: "12px",
            },
          },
        },
      },
    },
    defaultVisuals: {
      node: "default",
      window: "default",
    },
    _id: templateId,
    _creationTime: 0,
    updatedAt: 0,
  };

  const handleSaveTemplate = async (values: NodeTemplate) => {
    try {
      setIsSaving(true);
      const { _id, ...data } = values;

      await createOrUpdateTemplate({ templateId: _id, data });
      toast.success("Template sauvegardé avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde du template");
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
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
    setFieldValue: (field: string, value: any) => void
  ) {
    const { active, over } = event;
    if (!over) return;

    // Regarder si le targetElementId est root ou s'il contient div-. Si non, on ne fait rien
    if (over.id !== "root" && !String(over.id).startsWith("div-")) {
      return;
    }

    const action = active.data.current?.action;
    const nodeVisualLayoutToEdit = get(
      values,
      currentVisualLayoutPath
    ) as LayoutElement;

    // Déterminer le type de visuel (node ou window) depuis le path
    const visualType = currentVisualLayoutPath.includes("visuals.window")
      ? "window"
      : "node";

    // Ajout depuis le panel de gauche
    if (action === "add") {
      // Check if active.data.current.id is already in the layout to avoid duplicates
      const isDuplicate = nodeVisualLayoutToEdit.children?.some(
        (child) => child.id === active.data.current?.element?.id
      );
      if (isDuplicate) {
        return;
      }

      // Add and update layout
      const updatedLayout = addElementToLayout(
        active.data.current?.element as LayoutElement,
        String(over.id),
        nodeVisualLayoutToEdit,
        visualType,
        values
      );
      setFieldValue(currentVisualLayoutPath, updatedLayout);
    }

    // Réorganisation des éléments dans le tree
    else if (action === "sort") {
      const updatedLayout = moveElementInLayout(
        String(active.id),
        String(over.id),
        nodeVisualLayoutToEdit,
        visualType,
        values
      );
      setFieldValue(currentVisualLayoutPath, updatedLayout);
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
        initialValues={{ ...initialValues, ...template }}
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
                  disabled={isSaving}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white w-fit rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Sauvegarde en cours..." : "Sauvegarder"}
                </button>
              </div>
            </div>
          );
        }}
      </Formik>
    </NodeEditorContext.Provider>
  );
}
