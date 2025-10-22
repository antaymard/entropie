import { HiOutlineXMark } from "react-icons/hi2";
import { Formik } from "formik";

import type { NodeTemplate } from "../../types";
import NodeEditorLeftPanel from "./NodeEditorLeftPanel";
import NodeEditorTreePanel from "./NodeEditorTreePanel";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

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
      node: "",
      window: "",
    },
  };

  const handleSubmit = (values: NodeTemplate) => {
    console.log("Form submitted:", values);
  };

  function getLayoutItems(element: any) {
    let ids = [element.id];
    element.children?.forEach((child: any) => {
      ids = [...ids, ...getLayoutItems(child)];
    });
    return ids;
  }

  const layoutIds = getLayoutItems(initialValues.visuals.node.default.layout);

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
        {({ values }) => (
          <DndContext onDragEnd={console.log}>
            <div className="grid grid-cols-[minmax(0,310px)_minmax(0,310px)_auto]">
              <NodeEditorLeftPanel />

              <SortableContext items={layoutIds}>
                <NodeEditorTreePanel />
              </SortableContext>
              <pre className="p-4 bg-gray-50 overflow-auto">
                {JSON.stringify(values, null, 2)}
              </pre>
            </div>
          </DndContext>
        )}
      </Formik>
    </div>
  );
}
