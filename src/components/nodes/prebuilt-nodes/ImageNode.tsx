import { type Node, useReactFlow } from "@xyflow/react";
import { memo } from "react";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import ImageField from "../../fields/ImageField";

function ImageNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();

  const handleImageChange = (
    newValue: Array<{
      url: string;
      inImageNavigation?: {
        scale: number;
        positionX: number;
        positionY: number;
      };
    }>
  ) => {
    if (newValue && newValue.length > 0) {
      updateNodeData(xyNode.id, {
        url: newValue[0].url,
        inImageNavigation: newValue[0].inImageNavigation,
      });
    }
  };

  // Convertir le format du node en format ImageField
  const imageFieldValue = xyNode.data.url
    ? [
        {
          url: xyNode.data.url as string,
          inImageNavigation: xyNode.data.inImageNavigation as
            | { scale: number; positionX: number; positionY: number }
            | undefined,
        },
      ]
    : [];

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode} />
      <NodeFrame
        xyNode={xyNode}
        headerless={Boolean(xyNode.data.headerless)}
        nodeContentClassName="-p-3 nodrag"
      >
        <ImageField
          field={{
            id: "image",
            name: "Image",
            type: "image",
          }}
          value={imageFieldValue}
          onChange={handleImageChange}
          visualSettings={{
            enableInImageNavigation: true,
            disableEditButton: false,
          }}
          visualType="node"
        />
      </NodeFrame>
    </>
  );
}

export default memo(ImageNode);
