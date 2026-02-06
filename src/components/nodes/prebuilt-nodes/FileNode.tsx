import { memo, useState } from "react";
import type { Node } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import { useNodeDataValues } from "@/hooks/useNodeData";
import type { Id } from "@/../convex/_generated/dataModel";
import { RiAttachment2 } from "react-icons/ri";
import { TbExternalLink, TbMaximize, TbPencil } from "react-icons/tb";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Input } from "@/components/shadcn/input";
import { UploadFile } from "@/components/fields/UploadFile";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import { useWindowsStore } from "@/stores/windowsStore";

type FileValue = {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
  key: string;
};

const defaultValue: FileValue[] = [];

function FileNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const { updateNodeDataValues } = useUpdateNodeDataValues();
  const openWindow = useWindowsStore((s) => s.openWindow);

  const currentValue =
    (values?.files as FileValue[] | undefined) ?? defaultValue;
  const file = currentValue.length > 0 ? currentValue[0] : null;

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const handleUploadComplete = (fileData: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt: number;
    key: string;
  }) => {
    if (nodeDataId) {
      updateNodeDataValues({
        nodeDataId,
        values: { files: [fileData] },
      });
      setTitleDraft(fileData.filename);
    }
  };

  const handleSave = () => {
    if (nodeDataId && file && titleDraft.trim()) {
      updateNodeDataValues({
        nodeDataId,
        values: { files: [{ ...file, filename: titleDraft.trim() }] },
      });
    }
    setIsPopoverOpen(false);
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setTitleDraft(file?.filename ?? "");
    }
  };

  const isPdf = file?.mimeType === "application/pdf";

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        {isPdf && (
          <Button
            size="icon"
            variant="outline"
            onClick={() => openWindow(xyNode.id)}
          >
            <TbMaximize />
          </Button>
        )}
        <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="Modifier le fichier">
              <TbPencil />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col gap-2">
              <UploadFile
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,text/markdown,application/json,application/xml,application/zip,audio/*,video/*"
                onUploadComplete={handleUploadComplete}
              />
              <Input
                onDoubleClick={(e) => e.stopPropagation()}
                type="text"
                placeholder="Titre (optionnel)"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
              <Button size="sm" onClick={handleSave}>
                Valider
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode}>
        <div className="h-full w-full flex items-center gap-2 px-2 min-w-0 relative group/filenode">
          <RiAttachment2 size={18} className="shrink-0" />
          {file ? (
            <>
              <p className="truncate flex-1 min-w-0 text-sm">{file.filename}</p>
              {xyNode.selected && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background hover:bg-muted rounded-sm p-1 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TbExternalLink size={16} />
                </a>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun fichier</p>
          )}
        </div>
      </NodeFrame>
    </>
  );
}

export default memo(FileNode);
