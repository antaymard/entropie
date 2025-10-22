import { HiOutlineXMark } from "react-icons/hi2";
import { Formik } from "formik";

import type { NodeTemplate } from "../../types";
import type { LayoutElement } from "../../types/node.types";
import type { DragEndEvent } from "@dnd-kit/core";
import NodeEditorLeftPanel from "./NodeEditorLeftPanel";
import NodeEditorTreePanel from "./NodeEditorTreePanel";
import { DndContext } from "@dnd-kit/core";

export default function NodeEditor() {
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

  const handleSubmit = (values: NodeTemplate) => {
    console.log("Form submitted:", values);
  };

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
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ values, setFieldValue }) => {
          const defaultVariantId = values.default_visuals?.node || "default";

          const handleDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over) return;

            console.log("Drag ended:", { active, over });

            // Si on drag un field depuis LeftPanel (nouveau field à ajouter au layout)
            if (active.data.current?.type === "field") {
              const field = active.data.current.field;
              const overId = over.id;

              // Créer un nouvel élément field pour le layout
              const newFieldElement: LayoutElement = {
                id: field.id,
                element: "field",
              };

              // Fonction récursive pour ajouter l'élément dans le bon conteneur
              const addFieldToLayout = (
                layout: LayoutElement,
                targetId: string
              ): LayoutElement => {
                if (layout.id === targetId) {
                  // On a trouvé le conteneur cible
                  return {
                    ...layout,
                    children: [...(layout.children || []), newFieldElement],
                  };
                }

                // Chercher dans les enfants
                if (layout.children) {
                  return {
                    ...layout,
                    children: layout.children.map((child) =>
                      addFieldToLayout(child, targetId)
                    ),
                  };
                }

                return layout;
              };

              const currentLayout =
                values.visuals.node[defaultVariantId].layout;
              const updatedLayout = addFieldToLayout(
                currentLayout,
                overId as string
              );
              setFieldValue(
                `visuals.node.${defaultVariantId}.layout`,
                updatedLayout
              );
              return;
            }

            // Sinon, c'est un réarrangement interne (TODO: à implémenter)
            console.log("Réarrangement interne à implémenter");
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
