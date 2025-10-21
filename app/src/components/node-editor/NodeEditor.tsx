import { HiOutlineXMark } from "react-icons/hi2";
import { Formik, Form } from "formik";

import type { NodeTemplate } from "../../types";
import NodeEditorLeftPanel from "./NodeEditorLeftPanel";

export default function NodeEditor() {
  const initialValues: NodeTemplate = {
    name: "",
    description: "",
    icon: "",
    is_system: false,
    user_id: null,
    fields: [],
    visuals: {
      node: {},
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
          <Form>
            <div className="grid grid-cols-[minmax(0,310px)_auto]">
              <NodeEditorLeftPanel />
              {/* <NodeEditorMainPanel /> */}
              <pre className="p-4 bg-gray-50 overflow-auto">
                {JSON.stringify(values, null, 2)}
              </pre>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
