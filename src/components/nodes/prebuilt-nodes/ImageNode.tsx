import { memo, useCallback } from "react";
import type { Node } from "@xyflow/react";
import { areNodePropsEqual } from "../areNodePropsEqual";
import NodeFrame from "../NodeFrame";
import { useNodeDataValues } from "@/hooks/useNodeData";
import type { Id } from "@/../convex/_generated/dataModel";
import { TbMaximize, TbPencil, TbPhoto } from "react-icons/tb";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { UploadFile } from "@/components/fields/UploadFile";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import { useWindowsStore } from "@/stores/windowsStore";
import { useTranslation } from "react-i18next";

type Value = Array<{
  url: string;
}>;

const defaultValue: Value = [];

function ImageNode(xyNode: Node) {
  const { t } = useTranslation();
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const { updateNodeDataValues } = useUpdateNodeDataValues();
  const openWindow = useWindowsStore((s) => s.openWindow);

  const currentValue = (values?.images as Value | undefined) ?? defaultValue;

  const handleOpenWindow = useCallback(() => {
    if (!nodeDataId) return;
    openWindow({ xyNodeId: xyNode.id, nodeDataId, nodeType: "image" });
  }, [nodeDataId, openWindow, xyNode.id]);

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
        values: {
          images: [
            {
              url: fileData.url,
              filename: fileData.filename,
              mimeType: fileData.mimeType,
              size: fileData.size,
              uploadedAt: fileData.uploadedAt,
              key: fileData.key,
            },
          ],
        },
      });
    }
  };

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Button
          size="icon"
          variant="outline"
          disabled={!nodeDataId}
          onClick={handleOpenWindow}
        >
          <TbMaximize />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title={t("nodes.uploadImage")}>
              <TbPencil />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="">
            <UploadFile
              accept="image/*"
              onUploadComplete={handleUploadComplete}
            />
          </PopoverContent>
        </Popover>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode}>
        {currentValue.length ? (
          <img
            src={currentValue[0].url}
            alt="Node Image"
            className="w-full h-full object-contain rounded-[4px]"
          />
        ) : (
          <div className="h-full w-full flex flex-col gap-2 items-center justify-center">
            <TbPhoto size={24} />
            No image
          </div>
        )}
      </NodeFrame>
    </>
  );
}

export default memo(ImageNode, areNodePropsEqual);
