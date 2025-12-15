import { useStore } from "@xyflow/react";
import { memo } from "react";
import type { Node } from "@xyflow/react";
import WindowFrame from "../WindowFrame";
import PdfViewerField from "@/components/fields/file-fields/PdfViewerField";
import type { FileFieldType } from "@/components/fields/file-fields/FileNameField";

interface FileWindowProps {
  windowId: string;
}

function FileWindow({ windowId }: FileWindowProps) {
  // Récupère uniquement la data du node, re-render uniquement quand elle change
  const nodeData = useStore(
    (state) => state.nodes.find((n: Node) => n.id === windowId)?.data
  );
  const value = (nodeData?.files as FileFieldType[]) || [];

  return (
    <WindowFrame windowId={windowId} contentClassName="p-0! ">
      <PdfViewerField value={value} />
    </WindowFrame>
  );
}

export default memo(FileWindow);
