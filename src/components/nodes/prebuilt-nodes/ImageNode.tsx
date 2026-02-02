import { memo } from "react";
import type { Node } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import { useNodeDataValues } from "@/hooks/useNodeDataValues";
import type { Id } from "@/../convex/_generated/dataModel";
import { TbPhoto, TbPhotoEdit } from "react-icons/tb";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { UploadFile } from "@/components/fields/UploadFile";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";

type Value = Array<{
  url: string;
}>;

const defaultValue: Value = [];

function ImageNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const { updateNodeDataValues } = useUpdateNodeDataValues();

  const currentValue = (values?.images as Value | undefined) ?? defaultValue;

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
        values: { images: [{ url: fileData.url }] },
      });
    }
  };

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <TbPhotoEdit />
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
            Pas d'image
          </div>
        )}
      </NodeFrame>
    </>
  );
}

export default memo(ImageNode);
