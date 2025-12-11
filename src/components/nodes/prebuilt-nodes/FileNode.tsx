import { useReactFlow, type Node } from "@xyflow/react";
import { useCallback } from "react";
import NodeFrame from "../NodeFrame";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import FileField, { type FileFieldType } from "@/components/fields/FileField";

// Composant principal qui gère la sélection et les interactions
function FileNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();
  const nodeData = xyNode.data || ([] as FileFieldType[]);

  const handleSave = useCallback(
    (val: FileFieldType[]) => {
      console.log("Saving file node data:", val);
      updateNodeData(xyNode.id, { files: val });
    },
    [updateNodeData, xyNode.id]
  );

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}></CanvasNodeToolbar>
      <NodeFrame
        xyNode={xyNode}
        nodeContentClassName="p-2 items-center justify-center"
        headerless
        notResizable
      >
        <FileField
          value={nodeData?.files || []}
          onChange={handleSave}
          className="hover:bg-transparent bg-transparent"
        />
      </NodeFrame>
    </>
  );
}

export default FileNode;
