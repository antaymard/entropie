import NodeEditorLeftPanel from "./NodeEditorLeftPanel";
import NodeEditorMainPanel from "./NodeEditorMainPanel";
import { HiOutlineXMark } from "react-icons/hi2";

export default function NodeEditor() {
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

      <div className="grid grid-cols-[minmax(0,310px)_auto]">
        <NodeEditorLeftPanel />
        <NodeEditorMainPanel />
      </div>
    </div>
  );
}
