import { memo } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import { UploadFile } from "@/components/fields/UploadFile";
import { type UploadedFileData } from "@/hooks/useFilesUpload";

function FloatingTextNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();

  if (!xyNode) return null;

  const file = xyNode.data.file as UploadedFileData | undefined;

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}></CanvasNodeToolbar>

      <NodeFrame xyNode={xyNode} headerless>
        <UploadFile
          accept="image/*"
          onUploadComplete={(fileData) => {
            // Mettre à jour ton state local
            updateNodeData(xyNode.id, { file: fileData });
          }}
        />
        {file && (
          <img src={file.url} alt="Uploaded file" className="mt-2 max-w-full" />
        )}
        <pre>{JSON.stringify(file, null, 2)}</pre>
      </NodeFrame>
    </>
  );
}

export default memo(FloatingTextNode);
