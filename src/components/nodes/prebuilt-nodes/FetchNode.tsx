import NodeFrame from "@/components/nodes/NodeFrame";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { type Node } from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { TbPencil } from "react-icons/tb";
import { Button } from "@/components/shadcn/button";
import { useState } from "react";

export default function FetchNode(xyNode: Node) {
  const nodeData = useNodeDataValues(
    xyNode.data?.nodeDataId as Id<"nodeDatas">,
  );

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="Editer le lien">
              <TbPencil />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col gap-2">omg</div>
          </PopoverContent>
        </Popover>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode}>
        <pre>{JSON.stringify(nodeData, null, 2)}</pre>
      </NodeFrame>
    </>
  );
}
