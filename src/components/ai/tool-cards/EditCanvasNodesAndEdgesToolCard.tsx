import ToolCardFrame from "./ToolCardFrame";
import { TbFilePencil } from "react-icons/tb";

export default function EditCanvasNodesAndEdgesToolCard({
  state,
  input,
  output,
}: any) {
  return (
    <ToolCardFrame
      name="Writing to canvas"
      state={state}
      icon={TbFilePencil}
    >
      <div className="flex flex-col divide-y divide-white/20 -mx-2 text-white">
        <p>Input</p>
        <pre className="bg-white/5 rounded p-2 my-2 overflow-x-auto text-sm">
          {JSON.stringify(input, null, 2)}
        </pre>
        <p>Output</p>
        <pre className="bg-white/5 rounded p-2 my-2 overflow-x-auto text-sm">
          {JSON.stringify(output, null, 2)}
        </pre>
      </div>
    </ToolCardFrame>
  );
}
