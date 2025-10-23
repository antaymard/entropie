import { HiOutlineXMark } from "react-icons/hi2";
import { Formik } from "formik";

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

  const handleConfirmTemplate = (values: NodeTemplate) => {
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
      <Formik initialValues={initialValues} onSubmit={handleConfirmTemplate}>
        {({ values, setFieldValue }) => {
          const defaultVariantId = values.default_visuals?.node || "default";

          const handleDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over || active.id === over.id) return;

            console.log("Drag ended:", { active, over });

            const currentLayout = values.visuals.node[defaultVariantId].layout;

            // Si on drag un field depuis LeftPanel (nouveau field à ajouter au layout)
            // LeftPanel a { type: "field", field: NodeField }
            // TreePanel a { type: "field", element: LayoutElement } ou { type: "container", element: LayoutElement }
            if (active.data.current?.field) {
              const field = active.data.current.field;
              const overId = over.id as string;

              // Vérifier si le field n'est pas déjà dans le layout
              const isFieldAlreadyInLayout = (
                layout: LayoutElement,
                fieldId: string
              ): boolean => {
                if (layout.id === fieldId && layout.element === "field")
                  return true;
                if (layout.children) {
                  return layout.children.some((child) =>
                    isFieldAlreadyInLayout(child, fieldId)
                  );
                }
                return false;
              };

              if (isFieldAlreadyInLayout(currentLayout, field.id)) {
                console.log("Field already in layout");
                return;
              }

              // Créer un nouvel élément field
              const newFieldElement: LayoutElement = {
                id: field.id,
                element: "field",
              };

              // On ajoute toujours dans un conteneur (root ou div)
              // Si over est un conteneur, on ajoute dedans
              // Si over est un field, on trouve son parent
              let targetContainerId = overId;

              if (over.data.current?.type === "field") {
                // Trouver le parent du field
                const findParent = (
                  layout: LayoutElement,
                  elementId: string
                ): LayoutElement | null => {
                  if (layout.children) {
                    for (const child of layout.children) {
                      if (child.id === elementId) return layout;
                      const found = findParent(child, elementId);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const parent = findParent(currentLayout, overId);
                if (parent) {
                  targetContainerId = parent.id;
                }
              }

              // Ajouter dans le conteneur cible
              const addFieldToContainer = (
                layout: LayoutElement,
                containerId: string
              ): LayoutElement => {
                if (layout.id === containerId) {
                  return {
                    ...layout,
                    children: [...(layout.children || []), newFieldElement],
                  };
                }
                if (layout.children) {
                  return {
                    ...layout,
                    children: layout.children.map((child) =>
                      addFieldToContainer(child, containerId)
                    ),
                  };
                }
                return layout;
              };

              const updatedLayout = addFieldToContainer(
                currentLayout,
                targetContainerId
              );
              setFieldValue(
                `visuals.node.${defaultVariantId}.layout`,
                updatedLayout
              );
              return;
            }

            // Réorganisation interne
            const activeId = active.id as string;
            const overId = over.id as string;

            // Fonction pour trouver le parent
            const findParent = (
              layout: LayoutElement,
              elementId: string
            ): LayoutElement | null => {
              if (layout.children) {
                for (const child of layout.children) {
                  if (child.id === elementId) return layout;
                  const found = findParent(child, elementId);
                  if (found) return found;
                }
              }
              return null;
            };

            const activeParent = findParent(currentLayout, activeId);
            const overParent = findParent(currentLayout, overId);

            // Cas 1: Reorder dans le même parent
            if (activeParent && activeParent.id === overParent?.id) {
              const reorder = (layout: LayoutElement): LayoutElement => {
                if (layout.id === activeParent.id && layout.children) {
                  const oldIndex = layout.children.findIndex(
                    (c) => c.id === activeId
                  );
                  const newIndex = layout.children.findIndex(
                    (c) => c.id === overId
                  );
                  if (oldIndex !== -1 && newIndex !== -1) {
                    return {
                      ...layout,
                      children: arrayMove(layout.children, oldIndex, newIndex),
                    };
                  }
                }
                if (layout.children) {
                  return {
                    ...layout,
                    children: layout.children.map(reorder),
                  };
                }
                return layout;
              };

              setFieldValue(
                `visuals.node.${defaultVariantId}.layout`,
                reorder(currentLayout)
              );
              return;
            }

            // Cas 2: Déplacement vers un conteneur (over est un div ou root)
            if (over.data.current?.type === "container") {
              const targetId = overId;

              // Retirer l'élément
              const remove = (
                layout: LayoutElement
              ): { layout: LayoutElement; removed: LayoutElement | null } => {
                if (layout.children) {
                  const index = layout.children.findIndex(
                    (c) => c.id === activeId
                  );
                  if (index !== -1) {
                    return {
                      layout: {
                        ...layout,
                        children: layout.children.filter(
                          (c) => c.id !== activeId
                        ),
                      },
                      removed: layout.children[index],
                    };
                  }
                  let removed: LayoutElement | null = null;
                  const children = layout.children.map((child) => {
                    const result = remove(child);
                    if (result.removed) removed = result.removed;
                    return result.layout;
                  });
                  return { layout: { ...layout, children }, removed };
                }
                return { layout, removed: null };
              };

              const { layout: afterRemove, removed } = remove(currentLayout);
              if (!removed) return;

              // Ajouter dans le conteneur cible
              const add = (
                layout: LayoutElement,
                targetId: string,
                element: LayoutElement
              ): LayoutElement => {
                if (layout.id === targetId) {
                  return {
                    ...layout,
                    children: [...(layout.children || []), element],
                  };
                }
                if (layout.children) {
                  return {
                    ...layout,
                    children: layout.children.map((c) =>
                      add(c, targetId, element)
                    ),
                  };
                }
                return layout;
              };

              setFieldValue(
                `visuals.node.${defaultVariantId}.layout`,
                add(afterRemove, targetId, removed)
              );
            }
          };

          return (
            <DndContext onDragEnd={handleDragEnd}>
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
