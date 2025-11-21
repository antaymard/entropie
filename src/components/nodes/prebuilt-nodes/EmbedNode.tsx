import { useReactFlow, type Node } from "@xyflow/react";
import { memo, useCallback } from "react";
import NodeFrame from "../NodeFrame";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import { Toggle } from "@/components/shadcn/toggle";
import { TbPencil } from "react-icons/tb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";

function isUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Composant pour le contenu de l'iframe - fortement mémorisé
const EmbedContent = memo(
  ({ src }: { src: string }) => {
    return isUrl(src) ? (
      <iframe
        src={src}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Embedded Content"
      />
    ) : (
      <div
        dangerouslySetInnerHTML={{ __html: src }}
        className="w-full h-full"
      />
    );
  },
  (prevProps, nextProps) => {
    // Ne re-render que si le src change
    return prevProps.src === nextProps.src;
  }
);

EmbedContent.displayName = "EmbedContent";

// Composant principal qui gère la sélection et les interactions
function EmbedNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();

  const handleSave = useCallback(
    (src: string) => {
      updateNodeData(xyNode.id, { src });
    },
    [updateNodeData, xyNode.id]
  );

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <TbPencil />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Textarea
              value={String(xyNode.data.src)}
              onChange={(e) => handleSave(e.target.value)}
            />
          </PopoverContent>
        </Popover>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode} nodeContentClassName="p-0">
        <EmbedContent src={String(xyNode.data.src)} />
      </NodeFrame>
    </>
  );
}

export default EmbedNode;
