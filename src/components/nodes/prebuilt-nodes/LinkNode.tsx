import { useReactFlow, type Node } from "@xyflow/react";
import { memo, useCallback } from "react";
import NodeFrame from "../NodeFrame";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
// import { Toggle } from "@/components/shadcn/toggle";
// import { TbPencil } from "react-icons/tb";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/shadcn/popover";
// import { Button } from "@/components/shadcn/button";
// import { Textarea } from "@/components/shadcn/textarea";
import LinkField, { type LinkValueType } from "@/components/fields/LinkField";

// Composant principal qui gère la sélection et les interactions
function LinkNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();

  const handleSave = useCallback(
    (val: LinkValueType) => {
      updateNodeData(xyNode.id, val);
    },
    [updateNodeData, xyNode.id]
  );

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}></CanvasNodeToolbar>
      <NodeFrame
        xyNode={xyNode}
        nodeContentClassName="p-2 items-center justify-center"
        headerless
        notResizable
      >
        <LinkField
          value={xyNode.data as LinkValueType}
          onChange={handleSave}
          className="hover:bg-transparent"
        />
      </NodeFrame>
    </>
  );
}

export default LinkNode;
