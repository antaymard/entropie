import { memo } from "react";
import ImageField from "@/components/fields/ImageField";
import type { Id } from "@/../convex/_generated/dataModel";
import { useNodeDataValues } from "@/hooks/useNodeData";

interface ImageWindowProps {
  nodeDataId: Id<"nodeDatas">;
}

type ImageWindowValue = Array<{
  url: string;
  inImageNavigation?: {
    scale: number;
    positionX: number;
    positionY: number;
  };
}>;

function ImageWindow({ nodeDataId }: ImageWindowProps) {
  const nodeDataValues = useNodeDataValues(nodeDataId);
  const value = (nodeDataValues?.images as ImageWindowValue | undefined) ?? [];

  if (!nodeDataValues) return null;

  return (
    <div className="h-full w-full">
      <ImageField
        value={value}
        visualType="window"
        visualSettings={{
          enableInImageNavigation: true,
        }}
      />
    </div>
  );
}

export default memo(ImageWindow);
