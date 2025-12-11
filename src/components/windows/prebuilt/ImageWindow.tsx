import { useStore } from "@xyflow/react";
import { memo } from "react";
import type { Node } from "@xyflow/react";
import WindowFrame from "../WindowFrame";
import ImageField from "@/components/fields/ImageField";

interface ImageWindowProps {
  windowId: string;
}

function ImageWindow({ windowId }: ImageWindowProps) {
  // Récupère uniquement la data du node, re-render uniquement quand elle change
  const nodeData = useStore(
    (state) => state.nodes.find((n: Node) => n.id === windowId)?.data
  );
  const value = [{ url: nodeData?.url }];

  return (
    <WindowFrame windowId={windowId} contentClassName="p-0! scrollbar-hide">
      <ImageField
        value={value}
        visualType="window"
        visualSettings={{
          enableInImageNavigation: false,
          disableEditButton: true,
        }}
      />
    </WindowFrame>
  );
}

export default memo(ImageWindow);
