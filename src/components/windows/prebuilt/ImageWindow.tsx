import { memo, useEffect, useState } from "react";
import ImageField from "@/components/fields/ImageField";
import type { Id } from "@/../convex/_generated/dataModel";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";

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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (value.length > 0 && currentIndex >= value.length) {
      setCurrentIndex(value.length - 1);
    }
  }, [value.length, currentIndex]);

  if (!nodeDataValues) return null;

  const hasMultiple = value.length > 1;

  return (
    <div className="relative h-full w-full">
      <ImageField
        key={currentIndex}
        value={value.length > 0 ? [value[currentIndex]] : []}
        visualType="window"
        visualSettings={{ enableInImageNavigation: true }}
      />

      {hasMultiple && (
        <>
          {currentIndex > 0 && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors z-10"
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              <TbChevronLeft size={20} />
            </button>
          )}
          {currentIndex < value.length - 1 && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors z-10"
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              <TbChevronRight size={20} />
            </button>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-2.5 py-0.5 rounded-full z-10 pointer-events-none">
            {currentIndex + 1} / {value.length}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(ImageWindow);
