import { memo } from "react";
import PdfViewerField from "@/components/fields/file-fields/PdfViewerField";
import type { FileFieldType } from "@/components/fields/file-fields/FileNameField";
import type { Id } from "@/../convex/_generated/dataModel";
import { useNodeDataValues } from "@/hooks/useNodeData";

interface FileWindowProps {
  nodeDataId: Id<"nodeDatas">;
}

function FileWindow({ nodeDataId }: FileWindowProps) {
  const nodeDataValues = useNodeDataValues(nodeDataId);
  const value = (nodeDataValues?.files as FileFieldType[] | undefined) ?? [];

  if (!nodeDataValues) return null;

  return (
    <div className="h-full w-full">
      <PdfViewerField value={value} />
    </div>
  );
}

export default memo(FileWindow);
